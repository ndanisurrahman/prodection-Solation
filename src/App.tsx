/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ModuleType } from './types';
import { WorkersView } from './components/WorkersView';
import { InputsView } from './components/InputsView';
import { OutputsView } from './components/OutputsView';
import { MaterialsView } from './components/MaterialsView';
import { ThreadsView } from './components/ThreadsView';
import { PhonebookView } from './components/PhonebookView';
import { AttendanceView } from './components/AttendanceView';
import { AbsenteeismView } from './components/AbsenteeismView';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Users, LogIn as LoginIcon, LogOut, Activity, MessageSquare, Phone, Home, Search as SearchIcon, Zap, Tag, UserCheck, UserX, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';

const SECTIONS = [
  {
    title: "HR AND ADMINISTRATION",
    modules: [
      { id: 'workers' as ModuleType, label: 'Employees Info', icon: Users, color: 'text-blue-600' },
      { id: 'attendance' as ModuleType, label: 'Daily Attendance', icon: UserCheck, color: 'text-emerald-500' },
      { id: 'absenteeism' as ModuleType, label: 'Absenteeism', icon: UserX, color: 'text-rose-500' },
    ]
  },
  {
    title: "SEWING PRODUCTION",
    modules: [
      { id: 'inputs' as ModuleType, label: 'Input', icon: LoginIcon, color: 'text-blue-600' },
      { id: 'outputs' as ModuleType, label: 'Output', icon: LogOut, color: 'text-indigo-600' },
      { id: 'zippers' as ModuleType, label: 'Zipper', icon: Zap, color: 'text-amber-500' },
      { id: 'labels' as ModuleType, label: 'Label', icon: Tag, color: 'text-cyan-500' },
      { id: 'threads' as ModuleType, label: 'Thread', icon: Activity, color: 'text-indigo-500' },
    ]
  }
];

export default function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType | 'dashboard'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const minLoadingTime = 3000;
    const startTime = Date.now();

    if (!auth) {
      console.error("Firebase Auth is not initialized. Please check your config.");
      setInitializing(false);
      setShowLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setShowLoading(false);
      }, remainingTime);
    });
    return unsubscribe;
  }, []);

  if (showLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1e293b]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Decorative outer pulse */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-white/20 rounded-[30px] blur-xl"
          />
          
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[30px] border border-white/20 flex items-center justify-center shadow-2xl relative z-10">
             <span className="text-4xl font-black text-white tracking-tighter">PS</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Production Solution</h1>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Developed by eooely</p>
          <div className="flex gap-1 justify-center mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1e293b] p-6 overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center relative z-10 border border-white/10"
        >
          <div className="w-24 h-24 bg-[#1e293b] rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <span className="text-4xl font-black text-white tracking-tighter">PS</span>
          </div>
          
          <h1 className="text-3xl font-black text-[#1e293b] mb-1 uppercase tracking-tighter leading-none italic">Production</h1>
          <h1 className="text-3xl font-black text-[#1e293b] mb-4 uppercase tracking-tighter leading-none">Solution</h1>
          <p className="text-slate-400 mb-10 text-sm font-bold uppercase tracking-[0.2em]">Pacific Attires Ltd.</p>
          
          <div className="space-y-4 px-2 sm:px-0">
            <button 
              onClick={loginWithGoogle}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95 group overflow-hidden"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider truncate">Sign in with Google Account</span>
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">Authorized Personnel Only</p>
          </div>
        </motion.div>

        {/* Footer Detail */}
        <div className="absolute bottom-10 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] flex flex-col items-center gap-1">
          <span>Version 2.0.4 • Developed by eooely</span>
          <span>Factory Systems</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentModule) {
      case 'workers': return <WorkersView />;
      case 'inputs': return <InputsView />;
      case 'outputs': return <OutputsView />;
      case 'zippers': return <MaterialsView type="zippers" title="Zipper Tracking" />;
      case 'labels': return <MaterialsView type="labels" title="Label Tracking" />;
      case 'threads': return <ThreadsView />;
      case 'phonebook': return <PhonebookView />;
      case 'attendance': return <AttendanceView />;
      case 'absenteeism': return <AbsenteeismView />;
      default:
        return (
          <div className="pb-24">
            <header className="px-6 pt-8 pb-4">
              <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tighter">Production Solution</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">{user.displayName || 'STAFF'} • PACIFIC ATTIRES LTD.</p>
            </header>

            {SECTIONS.map((section, idx) => (
              <div key={idx} className="mt-8 px-6">
                <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">{section.title}</h2>
                <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                  {section.modules.map((module, mIdx) => (
                    <button
                      key={mIdx}
                      onClick={() => setCurrentModule(module.id)}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-[75px] h-[75px] bg-white rounded-[20px] shadow-md flex items-center justify-center transition-all group-active:scale-95 border border-slate-50">
                        <module.icon className={cn("w-8 h-8", module.color)} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 text-center leading-tight px-1 uppercase tracking-tight">
                        {module.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  const handleModuleClick = (moduleId: ModuleType | 'dashboard') => {
    setCurrentModule(moduleId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[100] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-[#1e293b] text-white">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl border border-white/20">PS</div>
                   <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"><X size={20} /></button>
                </div>
                
                <h3 className="text-lg font-black uppercase tracking-tighter italic leading-none">Production Solution</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2 truncate">
                   {user?.displayName || (user?.email?.split('@')[0]) || 'Staff Member'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {SECTIONS.map((section, sIdx) => (
                  <div key={sIdx}>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">{section.title}</h4>
                    <div className="space-y-1">
                      {section.modules.map((module, mIdx) => (
                        <button
                          key={mIdx}
                          onClick={() => handleModuleClick(module.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]",
                            currentModule === module.id ? "bg-slate-50 text-[#1e293b]" : "text-slate-500 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-100", currentModule === module.id ? "ring-2 ring-[#1e293b]/5" : "")}>
                              <module.icon size={18} className={module.color} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight">{module.label}</span>
                          </div>
                          {currentModule === module.id && <div className="w-1.5 h-1.5 bg-[#1e293b] rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Account</h4>
                   <button
                     onClick={() => logout()}
                     className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98]"
                   >
                     <div className="p-2 rounded-xl bg-white shadow-sm border border-rose-100">
                       <LogOut size={18} />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-tight">Logout Session</span>
                   </button>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-50 text-center">
                 <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Pacific Attires Ltd. • v2.0.4</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="bg-[#1e293b] text-white h-16 flex items-center px-6 sticky top-0 z-50">
        <button onClick={() => setSidebarOpen(true)} className="mr-6 p-2 hover:bg-white/10 rounded-full transition-colors">
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter flex-1 text-center pr-12 italic">Pacific Attires</h2>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentModule}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#f1f5f9] border-t border-slate-200 flex items-center justify-around h-16 px-4 z-50">
        <button onClick={() => setCurrentModule('dashboard')} className={cn("p-2", currentModule === 'dashboard' ? "bg-white rounded-full shadow-sm text-[#1e293b]" : "text-slate-400")}>
          <Home size={26} fill={currentModule === 'dashboard' ? "#1e293b" : "none"} strokeWidth={2.5} />
        </button>
        <button className="p-2 text-slate-400">
          <SearchIcon size={26} strokeWidth={2.5} />
        </button>
        <button className="p-2 text-slate-400">
          <MessageSquare size={26} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => setCurrentModule('phonebook')} 
          className={cn("p-2", currentModule === 'phonebook' ? "bg-white rounded-full shadow-sm text-green-600" : "text-slate-400")}
        >
          <Phone size={26} strokeWidth={2.5} fill={currentModule === 'phonebook' ? "currentColor" : "none"} />
        </button>
      </nav>
    </div>
  );
}



