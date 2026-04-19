import React, { useState } from 'react';
import { SIZES } from '../constants';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RowDetail {
  cutting_no: string;
  size: string;
  quantity: number;
  body_size?: string;
  zipper_size?: string;
  country?: string;
}

interface CommonRecordFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  title: string;
  initialData?: any;
  mode?: 'zipper' | 'label' | 'standard';
}

export function CommonRecordForm({ onSave, onCancel, title, initialData, mode = 'standard' }: CommonRecordFormProps) {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [poPf, setPoPf] = useState(initialData?.po_pf || '');
  const [buyer, setBuyer] = useState(initialData?.buyer || '');
  const [color, setColor] = useState(initialData?.color || '');
  
  const [details, setDetails] = useState<RowDetail[]>(
    initialData?.details || [{ cutting_no: '', size: '', quantity: 0 }]
  );

  const addRow = () => {
    setDetails([...details, { cutting_no: '', size: '', quantity: 0 }]);
  };

  const removeRow = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: keyof RowDetail, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const totalQuantity = details.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      po_pf: poPf,
      buyer,
      color,
      details,
      quantity: totalQuantity
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="relative w-full max-w-lg bg-white sm:rounded-[30px] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#1e293b] p-6 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-tight">{title}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
               <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} />
             </div>
             <input placeholder="PO / PF" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none" value={poPf} onChange={e => setPoPf(e.target.value)} />
             <input placeholder="Buyer" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none" value={buyer} onChange={e => setBuyer(e.target.value)} />
             <input placeholder="Color" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 text-sm font-bold text-slate-700 outline-none" value={color} onChange={e => setColor(e.target.value)} />
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-bold text-[#1e293b] mb-4 uppercase tracking-wider border-b pb-2">Record Details</h3>
            <div className="space-y-4">
              {details.map((row, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <input 
                    placeholder="Cutting No" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    value={row.cutting_no}
                    onChange={e => updateRow(idx, 'cutting_no', e.target.value)}
                  />
                  
                  {mode === 'zipper' && (
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                        placeholder="Body Size" 
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                        value={row.body_size || ''}
                        onChange={e => updateRow(idx, 'body_size', e.target.value)}
                      />
                       <input 
                        placeholder="Zipper Size" 
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                        value={row.zipper_size || ''}
                        onChange={e => updateRow(idx, 'zipper_size', e.target.value)}
                      />
                    </div>
                  )}

                  {mode === 'label' && (
                     <input 
                      placeholder="Country" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                      value={row.country || ''}
                      onChange={e => updateRow(idx, 'country', e.target.value)}
                    />
                  )}

                  <div className="relative">
                    <input 
                      list={`sizes-${idx}`}
                      placeholder="Size" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                      value={row.size}
                      onChange={e => updateRow(idx, 'size', e.target.value)}
                    />
                    <datalist id={`sizes-${idx}`}>
                      {SIZES.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    value={row.quantity}
                    onChange={e => updateRow(idx, 'quantity', e.target.value)}
                  />
                  {details.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="w-full bg-red-500 text-white flex items-center justify-center py-2 rounded-lg active:scale-95 transition-all"
                    >
                      <Minus size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={addRow}
                className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-lg shadow-lg active:scale-90 transition-all font-bold"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <label className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">Total Quantity</label>
            <div className="text-4xl font-black text-[#1e293b] mt-2">{totalQuantity}</div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50 sm:rounded-b-[30px]">
          <button onClick={onCancel} className="flex-1 bg-slate-200 text-slate-600 py-4 rounded-xl font-bold uppercase tracking-widest">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 bg-[#1e293b] text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-slate-200 transition-all">Save</button>
        </div>
      </motion.div>
    </div>
  );
}
