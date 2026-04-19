import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Worker } from '../types';
import { Plus, Trash2, Edit2, Search, X, Camera, FileUp, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function WorkersView() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'personal'>('basic');
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    worker_id: '',
    name: '',
    phone: '',
    skill: '',
    designation: '',
    line_no: '',
    join_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'workers'), orderBy('worker_id', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleScanID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: {
            parts: [
              { inlineData: { mimeType: file.type, data: base64Data } },
              { text: "Extract worker information from this ID card. Return as JSON with keys: worker_id, name, designation, phone." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                worker_id: { type: Type.STRING },
                name: { type: Type.STRING },
                designation: { type: Type.STRING },
                phone: { type: Type.STRING },
              }
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        setFormData(prev => ({
          ...prev,
          worker_id: result.worker_id || prev.worker_id,
          name: result.name || prev.name,
          designation: result.designation || prev.designation,
          phone: result.phone || prev.phone
        }));
        setIsScanning(false);
      };
    } catch (error) {
      console.error("Scan failed:", error);
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await updateDoc(doc(db, 'workers', editingWorker.id!), formData);
      } else {
        await addDoc(collection(db, 'workers'), formData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving worker:", error);
    }
  };

  const resetForm = () => {
    setFormData({ worker_id: '', name: '', phone: '', skill: '', designation: '', line_no: '', join_date: new Date().toISOString().split('T')[0] });
    setIsAdding(false);
    setEditingWorker(null);
    setActiveTab('basic');
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.worker_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Employees Information - Pacific Attires Ltd.", 14, 15);
    
    const tableData = filteredWorkers.map((w, idx) => [
      idx + 1,
      w.worker_id,
      w.name,
      w.phone || 'N/A',
      (w as any).designation || w.skill || 'N/A'
    ]);

    autoTable(doc, {
      head: [['SL', 'ID NUMBER', 'NAME', 'PHONE', 'DESIGNATION']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: '#1e293b' }
    });

    doc.save(`employees_info_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredWorkers.map((w, idx) => ({
      'SL NO.': idx + 1,
      'ID NUMBER': w.worker_id,
      'NAME': w.name,
      'PHONE': w.phone || 'N/A',
      'DESIGNATION': (w as any).designation || w.skill || 'N/A',
      'LINE NO.': w.line_no || 'N/A',
      'JOIN DATE': w.join_date || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `employees_info_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#1e293b] mb-6">Employees Information</h1>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search by ID or Phone..." 
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1e293b] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button 
            onClick={exportToPDF}
            className="flex-1 bg-[#1e293b] text-white py-3 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95 transition-all"
          >
            Export PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="flex-1 bg-[#10b981] text-white py-3 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95 transition-all"
          >
            Export Excel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-[#1e293b] text-white grid grid-cols-5 px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
            <span>SL NO.</span>
            <span>ID NUMBER</span>
            <span>NAME</span>
            <span>PHONE</span>
            <span>DESIGNATION</span>
          </div>

          <div className="divide-y divide-slate-50 min-h-[300px]">
             {loading ? (
                <div className="py-20 text-center text-slate-400 font-medium">Loading employees...</div>
              ) : filteredWorkers.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium">No employees found.</div>
              ) : filteredWorkers.map((worker, idx) => (
                <div 
                  key={worker.id} 
                  className="grid grid-cols-5 px-4 py-4 text-[11px] items-center hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => { setEditingWorker(worker); setFormData(worker as any); setIsAdding(true); }}
                >
                  <span className="text-slate-400 font-bold">{idx + 1}</span>
                  <span className="text-slate-700 font-bold">{worker.worker_id}</span>
                  <span className="text-slate-700 font-bold truncate">{worker.name}</span>
                  <span className="text-blue-600 font-bold truncate">{worker.phone || 'N/A'}</span>
                  <span className="text-slate-700 font-bold truncate">{(worker as any).designation || worker.skill}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-20 right-6 w-16 h-16 bg-[#1e293b] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[60]"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      {/* Multi-tab Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-inner" onClick={resetForm} />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white sm:rounded-[30px] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#1e293b] p-6 text-white flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase tracking-tight">{editingWorker ? 'Update Employee' : 'Add New Employee'}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-white">
                {(['basic', 'skills', 'personal'] as const).map(tab => (
                   <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                      activeTab === tab ? "text-[#1e293b] border-b-2 border-[#1e293b]" : "text-slate-400"
                    )}
                   >
                     {tab === 'basic' ? 'Basic Info' : tab === 'skills' ? 'Skills' : 'Personal Info'}
                   </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-[#1e293b] mb-4 uppercase tracking-wider border-b pb-2">Basic Information</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Office ID Card</label>
                           <div className="flex gap-2">
                             <label className="flex-1 flex items-center justify-center gap-2 bg-[#3b82f6] text-white py-3 rounded-lg text-sm font-bold cursor-pointer active:scale-95 transition-all">
                               <Camera size={18} /> Capture
                               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanID} />
                             </label>
                             <label className="flex-1 flex items-center justify-center gap-2 bg-[#1e293b] text-white py-3 rounded-lg text-sm font-bold cursor-pointer active:scale-95 transition-all">
                               <FileUp size={18} /> Choose File
                               <input type="file" accept="image/*" className="hidden" onChange={handleScanID} />
                             </label>
                           </div>
                           {isScanning && <p className="text-[10px] text-blue-600 font-bold animate-pulse text-center mt-2">Scanning ID Card...</p>}
                        </div>

                        <input 
                          placeholder="ID Number *" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                          value={formData.worker_id}
                          onChange={e => setFormData({...formData, worker_id: e.target.value})}
                        />
                        <input 
                          placeholder="Name *" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <input 
                          placeholder="Designation *" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                          value={formData.designation}
                          onChange={e => setFormData({...formData, designation: e.target.value})}
                        />
                        <input 
                          placeholder="Line Number" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                          value={formData.line_no}
                          onChange={e => setFormData({...formData, line_no: e.target.value})}
                        />
                        <input 
                          placeholder="Phone Number *" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Join Date</label>
                          <input 
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none"
                            value={formData.join_date}
                            onChange={e => setFormData({...formData, join_date: e.target.value})}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 uppercase tracking-wider border-b pb-2">Skills</h3>
                    <div className="flex gap-2">
                      <input placeholder="Item" className="flex-1 bg-slate-50 border rounded-lg px-3 py-3 text-xs" />
                      <input placeholder="Process" className="flex-[2] bg-slate-50 border rounded-lg px-3 py-3 text-xs" />
                      <button className="bg-red-500 text-white w-10 h-10 rounded-lg flex items-center justify-center"><Trash2 size={16} /></button>
                    </div>
                    <button className="bg-[#1e293b] text-white w-10 h-10 rounded-lg flex items-center justify-center"><Plus size={18} /></button>
                  </div>
                )}

                {activeTab === 'personal' && (
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-[#1e293b] mb-4 uppercase tracking-wider border-b pb-2">Personal Information</h3>
                      <textarea 
                        placeholder="Residential Address" 
                        className="w-full bg-slate-50 border rounded-lg px-4 py-4 text-sm h-32"
                      />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                <button onClick={resetForm} className="flex-1 bg-slate-200 text-slate-600 py-4 rounded-xl font-bold uppercase tracking-widest">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 bg-[#1e293b] text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-slate-200">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

