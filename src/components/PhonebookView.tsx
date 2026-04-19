import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Worker } from '../types';
import { Phone, Search, Users, ExternalLink, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';

export function PhonebookView() {
  const [contacts, setContacts] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Worker | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // We reuse the 'workers' collection as the source for the phonebook
    const q = query(collection(db, 'workers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      // Filter out contacts without phone numbers for the phonebook
      setContacts(data.filter(c => c.phone && c.phone.trim() !== ''));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdatePhone = async () => {
    if (!editingContact || !newPhone.trim()) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'workers', editingContact.id!), {
        phone: newPhone
      });
      setEditingContact(null);
    } catch (error) {
      console.error("Error updating phone:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Staff Phonebook</h1>
          <p className="text-slate-500 text-sm">Direct access to employee contact numbers</p>
        </header>
        
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search name, ID or phone..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1e293b] transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e293b] mx-auto mb-4"></div>
              <p className="text-slate-400 font-medium">Syncing contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Users size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No contacts found with phone numbers.</p>
            </div>
          ) : (
            filteredContacts.map((contact, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={contact.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[#1e293b] font-bold text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1e293b]">{contact.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <span>ID: {contact.worker_id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-blue-600 font-bold text-sm">{contact.phone}</p>
                      <button 
                        onClick={() => { setEditingContact(contact); setNewPhone(contact.phone); }}
                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-[#1e293b] rounded transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <a 
                  href={`tel:${contact.phone}`}
                  className="w-12 h-12 bg-[#10b981] text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-90 transition-all font-bold"
                >
                  <Phone size={20} fill="currentColor" />
                </a>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setEditingContact(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[30px] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-[#1e293b] mb-2 uppercase tracking-tight">Edit Phone Number</h2>
              <p className="text-slate-500 text-sm mb-6 font-medium">{editingContact.name}</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e293b]"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingContact(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdatePhone}
                    disabled={isUpdating}
                    className="flex-1 py-4 bg-[#1e293b] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-slate-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
