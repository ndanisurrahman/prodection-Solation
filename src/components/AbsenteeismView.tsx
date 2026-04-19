import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AttendanceRecord } from '../types';
import { Search, Info, Save, X, UserX } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AbsenteeismView() {
  const [absentees, setAbsentees] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Only fetch those who are 'absent'
    const q = query(
      collection(db, 'attendance'), 
      where('status', '==', 'absent'),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAbsentees(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateReason = async () => {
    if (!editingRecord) return;
    try {
      await updateDoc(doc(db, 'attendance', editingRecord.id!), {
        reason: reason
      });
      setEditingRecord(null);
      setReason('');
    } catch (error) {
      console.error("Error updating reason:", error);
    }
  };

  const filteredAbsentees = absentees.filter(a => 
    a.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.worker_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tighter">Absenteeism Record</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-wrap">History of absentees and their reasons</p>
        </header>

        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search by ID or Name..." 
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b] transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Fetching absent reports...</div>
          ) : filteredAbsentees.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 shadow-inner">
               <UserX size={48} className="text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No absenteeism records found.</p>
            </div>
          ) : (
            filteredAbsentees.map((record, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={record.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                
                <div className="flex items-center justify-between">
                  <div>
                     <h3 className="font-black text-[#1e293b] text-base leading-tight">{record.worker_name}</h3>
                     <p className="text-rose-500 text-[10px] font-black uppercase tracking-tighter mt-0.5">Absent on: {record.date}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">ID: {record.worker_id}</p>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">LINE: {record.line_no || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Absence:</span>
                      <button 
                        onClick={() => { setEditingRecord(record); setReason(record.reason || ''); }}
                        className="text-blue-600 font-black text-[10px] uppercase underline underline-offset-2"
                      >
                        {record.reason ? 'Edit Note' : 'Add Note'}
                      </button>
                   </div>
                   <p className={cn("text-xs leading-relaxed font-bold", record.reason ? "text-slate-600" : "text-slate-300 italic")}>
                      {record.reason || "No reason specified yet."}
                   </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm" onClick={() => setEditingRecord(null)} />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[30px] p-8 shadow-2xl flex flex-col"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">Absent Note</h2>
                   <button onClick={() => setEditingRecord(null)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-black text-xs">
                         ID
                      </div>
                      <div>
                         <h4 className="font-black text-[#1e293b] text-sm uppercase tracking-tight">{editingRecord.worker_name}</h4>
                         <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">{editingRecord.date}</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Explain the reason</label>
                      <textarea 
                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b] resize-none"
                        placeholder="e.g., Sick leave, Personal problem, etc."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                   </div>

                   <button 
                    onClick={handleUpdateReason}
                    className="w-full py-5 bg-[#1e293b] text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                   >
                     Save Reason Note
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
