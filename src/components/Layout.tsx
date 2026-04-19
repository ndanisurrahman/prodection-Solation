import React from 'react';
import { Home, ChevronRight, Menu, X } from 'lucide-react';
import { MODULES } from '../constants';
import { ModuleType } from '../types';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: ModuleType | 'dashboard';
  onNavigate: (module: ModuleType | 'dashboard') => void;
}

export function Layout({ children, currentModule, onNavigate }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-bottom border-slate-100 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">RMG Track Pro</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Enterprise Solution</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              currentModule === 'dashboard' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Home size={18} />
            Dashboard
          </button>
          
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] text-slate-400 border uppercase tracking-[0.1em] font-bold">Modules</span>
          </div>

          {MODULES.map((module) => (
            <button
              key={module.id}
              onClick={() => onNavigate(module.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                currentModule === module.id ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <module.icon size={18} className={cn(currentModule === module.id ? "text-white" : module.color)} />
              {module.label}
              {currentModule === module.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">JD</div>
            <div>
              <p className="text-xs font-semibold">User Account</p>
              <p className="text-[10px] text-slate-400">Production Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="lg:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 h-16 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">RMG Track Pro</h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-50 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-20 p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
           <button
            onClick={() => { onNavigate('dashboard'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 text-slate-900 font-semibold"
          >
            <Home size={20} />
            Dashboard
          </button>
          {MODULES.map((module) => (
            <button
              key={module.id}
              onClick={() => { onNavigate(module.id); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl font-semibold transition-colors",
                currentModule === module.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
              )}
            >
              <module.icon size={20} className={currentModule === module.id ? "text-white" : module.color} />
              {module.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        "lg:pl-64", // Desktop sidebar offset
        "pt-16 lg:pt-0" // Mobile header offset
      )}>
        {children}
      </main>
    </div>
  );
}
