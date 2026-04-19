import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MaterialRecord } from '../types';
import { Plus, Search } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { CommonRecordForm } from './CommonRecordForm';

interface MaterialsViewProps {
  type: 'zippers' | 'labels';
  title: string;
}

export function MaterialsView({ type, title }: MaterialsViewProps) {
  const [records, setRecords] = useState<MaterialRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaterialRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, type), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialRecord));
      setRecords(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (formData: any) => {
    try {
      if (editingRecord) {
        await updateDoc(doc(db, type, editingRecord.id!), formData);
      } else {
        await addDoc(collection(db, type), formData);
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
        <h1 className="text-2xl font-bold text-[#1e293b] mb-6">{title}</h1>
        
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
            <span>REM</span>
            <span>USED</span>
          </div>

          <div className="divide-y divide-slate-50 min-h-[300px]">
             {loading ? (
                <div className="py-20 text-center text-slate-400 font-medium">Loading records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium">No records found.</div>
              ) : filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="px-4 py-4 hover:bg-slate-50 transition-all cursor-pointer"
                    onClick={() => { setEditingRecord(record); setIsAdding(true); }}
                  >
                    <div className="grid grid-cols-5 text-[11px] items-center mb-1">
                      <span className="text-slate-500 font-bold">{formatDate(record.date)}</span>
                      <span className="text-slate-700 font-bold truncate">{record.po_pf}</span>
                      <span className="text-slate-700 font-bold truncate">{record.buyer}</span>
                      <span className="text-green-600 font-black">{record.remaining_qty || 0}</span>
                      <span className="text-slate-500 font-bold">{record.used_qty || 0}</span>
                    </div>
                    {record.details && record.details.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.details.map((d, i) => (
                          <div key={i} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex gap-2 font-medium">
                            <span>{d.cutting_no}</span>
                            {d.body_size && <span>Body: {d.body_size}</span>}
                            {d.zipper_size && <span>Zip: {d.zipper_size}</span>}
                            {d.country && <span>Ctry: {d.country}</span>}
                            <span className="text-[#1e293b]">Qty: {d.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
            title={editingRecord ? `Update ${title}` : `Add New ${title}`}
            initialData={editingRecord}
            onSave={handleSave}
            onCancel={() => { setIsAdding(false); setEditingRecord(null); }}
            mode={type === 'zippers' ? 'zipper' : 'label'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
