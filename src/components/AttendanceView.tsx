import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, writeBatch, doc, serverTimestamp, setDoc, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Worker, AttendanceRecord, AttendanceSession } from '../types';
import { Search, Calendar, CheckCircle, XCircle, Plus, FileText, ChevronRight, X, UserCheck, Save, Trash2, Edit3, User, History, Phone, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function AttendanceView() {
  const [view, setView] = useState<'list' | 'marking'>('list');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Marking state
  const [markingDate, setMarkingDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempAttendance, setTempAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail/Summary state
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>([]);
  const [loadingDayRecords, setLoadingDayRecords] = useState(false);
  const [editingReason, setEditingReason] = useState<{id: string, reason: string} | null>(null);

  // History search state
  const [historySearchId, setHistorySearchId] = useState('');
  const [workerHistory, setWorkerHistory] = useState<{records: AttendanceRecord[], worker: Worker | null} | null>(null);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  useEffect(() => {
    // 1. Listen for sessions
    const sessionsQ = query(collection(db, 'attendance_sessions'), orderBy('date', 'desc'));
    const unsubscribeSessions = onSnapshot(sessionsQ, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession)));
      setLoading(false);
    });

    // 2. Load workers for marking
    const workersQ = query(collection(db, 'workers'), orderBy('worker_id', 'asc'));
    const unsubscribeWorkers = onSnapshot(workersQ, (snapshot) => {
      setWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker)));
    });

    return () => {
      unsubscribeSessions();
      unsubscribeWorkers();
    };
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setLoadingDayRecords(true);
      const fetchDayRecords = async () => {
        const q = query(collection(db, 'attendance'), where('date', '==', selectedSession.date));
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setDayRecords(records);
        setLoadingDayRecords(false);
      };
      fetchDayRecords();
    } else {
      setDayRecords([]);
    }
  }, [selectedSession]);

  const handleSaveAttendance = async () => {
    if (Object.keys(tempAttendance).length === 0) {
      alert("Please mark attendance for at least one employee.");
      return;
    }

    setIsSaving(true);
    const batch = writeBatch(db);
    
    let pCount = 0;
    let aCount = 0;

    // Automatic Absenteeism: Loop through ALL workers
    workers.forEach(worker => {
      const status = tempAttendance[worker.worker_id] || 'absent';
      const docRef = doc(db, 'attendance', `${markingDate}_${worker.worker_id}`);
      
      batch.set(docRef, {
        worker_id: worker.worker_id,
        worker_name: worker.name,
        line_no: worker.line_no || 'N/A',
        phone: worker.phone || 'N/A', // Save phone for reports
        date: markingDate,
        status,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (status === 'present') pCount++;
      else aCount++;
    });

    // Save session summary
    const sessionRef = doc(db, 'attendance_sessions', markingDate);
    batch.set(sessionRef, {
      date: markingDate,
      presentCount: pCount,
      absentCount: aCount,
      totalWorkers: workers.length,
      updatedAt: serverTimestamp()
    }, { merge: true });

    try {
      await batch.commit();
      setView('list');
      setTempAttendance({});
      setMarkingDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateReason = async (recordId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'attendance', recordId), { reason });
      setDayRecords(prev => prev.map(r => r.id === recordId ? { ...r, reason } : r));
      setEditingReason(null);
    } catch (error) {
      console.error("Error updating reason:", error);
    }
  };

  const searchWorkerHistory = async () => {
    if (!historySearchId.trim()) return;
    setIsSearchingHistory(true);
    try {
      // Find worker first
      const workerMatch = workers.find(w => w.worker_id === historySearchId) || null;
      
      const q = query(
        collection(db, 'attendance'), 
        where('worker_id', '==', historySearchId),
        where('status', '==', 'absent'),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setWorkerHistory({ records, worker: workerMatch });
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsSearchingHistory(false);
    }
  };

  const exportPDF = (session: AttendanceSession, records: AttendanceRecord[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // #1e293b
    doc.text("DAILY ATTENDANCE REPORT", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`PACIFIC ATTIRES LTD. | DATE: ${session.date}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Statistics
    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Count']],
      body: [
        ['Total Employees', session.totalWorkers],
        ['Present', session.presentCount],
        ['Absent', session.absentCount]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
    });

    // Present List
    const presentList = records.filter(r => r.status === 'present');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`PRESENT EMPLOYEES (${presentList.length})`, 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['SL', 'ID NUMBER', 'NAME', 'PHONE', 'LINE']],
      body: presentList.map((r, i) => [i + 1, r.worker_id, r.worker_name, (r as any).phone || 'N/A', r.line_no || 'N/A']),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Absent List
    const absentList = records.filter(r => r.status === 'absent');
    doc.setFontSize(14);
    doc.setTextColor(244, 63, 94); // rose-500
    doc.text(`ABSENT EMPLOYEES (${absentList.length})`, 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['SL', 'ID NUMBER', 'NAME', 'PHONE', 'REASON']],
      body: absentList.map((r, i) => [i + 1, r.worker_id, r.worker_name, (r as any).phone || 'N/A', r.reason || 'Not Specified']),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [244, 63, 94] }
    });

    doc.save(`attendance_report_${session.date}.pdf`);
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.worker_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {view === 'list' ? (
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-[#1e293b] uppercase tracking-tighter leading-tight italic">Attendance</h1>
            <h1 className="text-3xl font-black text-[#1e293b] uppercase tracking-tighter leading-tight">Archives</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Saved Daily Reports</p>
          </header>

          <div className="space-y-4">
            {/* History Search Section */}
            <div className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 mb-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={14} /> Employee Absence History
               </h3>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Worker ID..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1e293b]"
                    value={historySearchId}
                    onChange={e => setHistorySearchId(e.target.value)}
                  />
                  <button 
                    onClick={searchWorkerHistory}
                    disabled={isSearchingHistory}
                    className="bg-[#1e293b] text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                  >
                    Search
                  </button>
               </div>

               <AnimatePresence>
                  {workerHistory && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-50">
                       <div className="flex items-center justify-between mb-4">
                          <div>
                             <h4 className="font-black text-[#1e293b]">{workerHistory.worker?.name || 'Unknown Worker'}</h4>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Absences: {workerHistory.records.length}</p>
                          </div>
                          <button onClick={() => setWorkerHistory(null)} className="text-slate-300 hover:text-[#1e293b]"><X size={18} /></button>
                       </div>
                       <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {workerHistory.records.length === 0 ? (
                             <p className="text-center py-4 text-[10px] text-slate-300 font-bold uppercase">No absent records found.</p>
                          ) : (
                             workerHistory.records.map(rec => (
                                <div key={rec.id} className="flex items-center justify-between p-2 bg-rose-50/50 rounded-lg border border-rose-100/50 border-dashed">
                                   <span className="text-[10px] font-bold text-rose-500">{rec.date}</span>
                                   <span className="text-[10px] text-slate-500 italic truncate ml-4 max-w-[150px]">{rec.reason || 'No reason specified'}</span>
                                </div>
                             ))
                          )}
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Archives...</div>
            ) : sessions.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-10 shadow-inner">
                <FileText size={48} className="text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records saved yet.</p>
                <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest mt-2">Click (+) to start marking</p>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#1e293b] rounded-[20px] flex flex-col items-center justify-center text-white shadow-lg shadow-slate-200">
                       <span className="text-[10px] font-black uppercase leading-none opacity-50">{session.date.split('-')[1]}</span>
                       <span className="text-xl font-black leading-none">{session.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#1e293b] text-lg leading-none mb-1">{session.date}</h3>
                      <div className="flex gap-3">
                         <span className="text-emerald-500 text-[10px] font-black uppercase tracking-tighter">P: {session.presentCount}</span>
                         <span className="text-rose-500 text-[10px] font-black uppercase tracking-tighter">A: {session.absentCount}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-slate-200 group-hover:text-[#1e293b] transition-colors" />
                </motion.div>
              ))
            )}
          </div>

          <button 
            onClick={() => setView('marking')}
            className="fixed bottom-20 right-6 w-16 h-16 bg-[#1e293b] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[60] border-4 border-white"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="p-0 flex flex-col min-h-screen bg-white">
           <header className="bg-[#1e293b] p-6 text-white sticky top-0 z-[70] shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <button onClick={() => setView('list')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={24} /></button>
                <div className="text-center">
                   <h2 className="text-xl font-black uppercase tracking-tighter italic">Mark Attendance</h2>
                   <input 
                      type="date" 
                      className="bg-white/10 border-none text-white text-xs font-black uppercase tracking-widest text-center mt-1 outline-none rounded-md px-2 py-1"
                      value={markingDate}
                      onChange={(e) => setMarkingDate(e.target.value)}
                   />
                </div>
                <button 
                  disabled={isSaving}
                  onClick={handleSaveAttendance} 
                  className={cn(
                    "px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2",
                    isSaving && "opacity-50 animate-pulse"
                  )}
                >
                   <Save size={14} /> Save
                </button>
             </div>
             
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search Worker..." 
                  className="w-full bg-white/10 border-none rounded-2xl pl-12 pr-4 py-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </header>

           <div className="p-6 space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee List ({workers.length})</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked: {Object.keys(tempAttendance).length}</span>
              </div>
              
              {filteredWorkers.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No workers matching search</div>
              ) : (
                filteredWorkers.map((worker) => (
                  <div key={worker.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e293b] font-black text-[10px] border border-slate-200 shadow-sm">
                        {worker.worker_id.slice(-2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1e293b] text-sm leading-tight">{worker.name}</h3>
                         <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter mt-0.5">ID: {worker.worker_id}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 focus-within:ring-0">
                       <button 
                         onClick={() => setTempAttendance(prev => ({ ...prev, [worker.worker_id]: 'present' }))}
                         className={cn(
                           "w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center transition-all border-2",
                           tempAttendance[worker.worker_id] === 'present' 
                             ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" 
                             : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200"
                         )}
                       >
                         P
                       </button>
                       <button 
                         onClick={() => setTempAttendance(prev => ({ ...prev, [worker.worker_id]: 'absent' }))}
                         className={cn(
                           "w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center transition-all border-2",
                           tempAttendance[worker.worker_id] === 'absent' 
                             ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200" 
                             : "bg-white border-slate-100 text-slate-400 hover:border-rose-200"
                         )}
                       >
                         A
                       </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Summary Modal */}
      <AnimatePresence>
        {selectedSession && (
           <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)} />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[30px] p-8 shadow-2xl flex flex-col"
              >
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter leading-none italic">Attendance Summary</h2>
                    <button onClick={() => setSelectedSession(null)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[25px] border border-slate-100 mb-4">
                       <div className="w-16 h-16 bg-[#1e293b] rounded-[22px] flex flex-col items-center justify-center text-white shadow-lg">
                          <span className="text-[10px] font-black uppercase opacity-50">{selectedSession.date.split('-')[1]}</span>
                          <span className="text-2xl font-black leading-none">{selectedSession.date.split('-')[2]}</span>
                       </div>
                       <div>
                          <h4 className="font-black text-[#1e293b] text-xl leading-none mb-1">{selectedSession.date}</h4>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Record: {selectedSession.totalWorkers}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-emerald-50 rounded-[25px] p-5 border border-emerald-100 flex flex-col items-center justify-center">
                          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Present</span>
                          <span className="text-3xl font-black text-emerald-600">{selectedSession.presentCount}</span>
                       </div>
                       <div className="bg-rose-50 rounded-[25px] p-5 border border-rose-100 flex flex-col items-center justify-center">
                          <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">Absent</span>
                          <span className="text-3xl font-black text-rose-600">{selectedSession.absentCount}</span>
                       </div>
                    </div>

                    {/* Detailed List Section */}
                    <div className="bg-slate-50/50 rounded-[25px] p-4 max-h-60 overflow-y-auto border border-slate-100">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Detailed Record</h4>
                       {loadingDayRecords ? (
                          <div className="text-center py-10 animate-pulse text-slate-300 font-bold uppercase text-[10px]">Loading Details...</div>
                       ) : (
                          <div className="space-y-2">
                             {dayRecords.filter(r => r.status === 'absent').map(record => (
                                <div key={record.id} className="bg-white p-3 rounded-xl border border-rose-50 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-[10px] font-black">A</div>
                                      <div>
                                         <p className="text-xs font-black text-[#1e293b]">{record.worker_name}</p>
                                         <p className="text-[9px] text-slate-400 font-bold leading-none">{record.reason || 'No reason set'}</p>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => setEditingReason({ id: record.id!, reason: record.reason || '' })}
                                     className="p-2 text-slate-300 hover:text-[#1e293b] bg-slate-50 rounded-lg"
                                   >
                                      <Edit3 size={14} />
                                   </button>
                                </div>
                             ))}
                             {dayRecords.filter(r => r.status === 'present').map(record => (
                                <div key={record.id} className="bg-white p-3 rounded-xl border border-emerald-50 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-[10px] font-black">P</div>
                                      <div>
                                         <p className="text-xs font-black text-[#1e293b]">{record.worker_name}</p>
                                         <p className="text-[9px] text-slate-400 font-bold leading-none">Present</p>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    <button 
                      onClick={() => exportPDF(selectedSession, dayRecords)}
                      className="w-full py-5 bg-[#1e293b] text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                    >
                      <Download size={18} /> Download Detailed PDF
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Edit Reason Modal */}
      <AnimatePresence>
         {editingReason && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e293b]/80 backdrop-blur-sm" onClick={() => setEditingReason(null)} />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[30px] p-8 shadow-2xl">
                  <h3 className="text-lg font-black text-[#1e293b] uppercase tracking-tighter mb-4 italic">Absence Note</h3>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b] min-h-[120px]"
                    placeholder="Enter reason for absence..."
                    value={editingReason.reason}
                    onChange={e => setEditingReason({ ...editingReason, reason: e.target.value })}
                  />
                  <div className="flex gap-3 mt-6">
                     <button onClick={() => setEditingReason(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                     <button onClick={() => handleUpdateReason(editingReason.id, editingReason.reason)} className="flex-1 py-4 bg-[#1e293b] text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Save Note</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
