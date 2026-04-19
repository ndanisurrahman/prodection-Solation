import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductionInput } from '../types';
import { Plus, Trash2, Edit2, Search, X, Download } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CommonRecordForm } from './CommonRecordForm';

export function InputsView() {
  const [records, setRecords] = useState<ProductionInput[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionInput | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'inputs'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionInput));
      setRecords(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (formData: any) => {
    try {
      if (editingRecord) {
        await updateDoc(doc(db, 'inputs', editingRecord.id!), formData);
      } else {
        await addDoc(collection(db, 'inputs'), formData);
      }
      setIsAdding(false);
      setEditingRecord(null);
    } catch (error) {
      console.error("Error saving record:", error);
    }
  };

  const filteredRecords = records.filter(r => 
    r.po_pf.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.details.some(d => d.cutting_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#1e293b] mb-6">Cutting Input</h1>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search by Cutting No, PO, or Buyer..." 
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1e293b] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button className="flex-1 bg-[#1e293b] text-white py-3 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all">Export PDF</button>
          <button className="flex-1 bg-[#10b981] text-white py-3 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all">Export Excel</button>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-[#1e293b] text-white grid grid-cols-5 px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
            <span>DATE</span>
            <span>PO / PF</span>
            <span>BUYER</span>
            <span>COLOR</span>
            <span>QTY</span>
          </div>

          <div className="divide-y divide-slate-50 min-h-[300px]">
             {loading ? (
                <div className="py-20 text-center text-slate-400 font-medium">Loading records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium">No records found.</div>
              ) : filteredRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="grid grid-cols-5 px-4 py-4 text-[11px] items-center hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => { setEditingRecord(record); setIsAdding(true); }}
                >
                  <span className="text-slate-500 font-bold">{formatDate(record.date)}</span>
                  <span className="text-slate-700 font-bold truncate">{record.po_pf}</span>
                  <span className="text-slate-700 font-bold truncate">{record.buyer}</span>
                  <span className="text-slate-700 font-bold truncate">{record.color}</span>
                  <span className="text-blue-600 font-black text-xs">{record.quantity}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => { setEditingRecord(null); setIsAdding(true); }}
        className="fixed bottom-20 right-6 w-16 h-16 bg-[#1e293b] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[60]"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {isAdding && (
          <CommonRecordForm 
            title={editingRecord ? "Update Input" : "Add New Input"}
            initialData={editingRecord}
            onSave={handleSave}
            onCancel={() => { setIsAdding(false); setEditingRecord(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

