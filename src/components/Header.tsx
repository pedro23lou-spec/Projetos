import React from 'react';
import { Sparkles, LayoutDashboard, Store, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  currentView: 'client' | 'admin';
  onViewChange: (view: 'client' | 'admin') => void;
  activePackagesCount: number;
  totalPackagesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activePackagesCount,
  totalPackagesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand Zone */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewChange('client')}
              className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg p-1 -m-1"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-950/40 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0A0E1A] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400 fill-purple-400/20" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  Social <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Networks</span>
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium leading-none tracking-wide">
                  Engajamento Real & Rápido
                </span>
              </div>
            </button>
          </div>

          {/* Status Indicator (Required: ● Sistema Online - Entregas Automáticas) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">
              Sistema Online <span className="text-slate-600">·</span> <span className="text-emerald-400">Entregas Automáticas</span>
            </span>
          </div>

          {/* Action Zone: Screen Switcher (Visão do Cliente vs Painel ADM) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher Segmented Control */}
            <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
              <button
                onClick={() => onViewChange('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'client'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                aria-label="Ver Loja do Cliente"
              >
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Loja</span>
                <span className="xs:hidden">Loja</span>
              </button>

              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                aria-label="Acessar Painel Administrativo"
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>ADM</span>
                <span className="ml-1 text-[10px] font-mono font-bold bg-slate-800/90 text-purple-300 px-1.5 py-0.2 rounded-md">
                  {activePackagesCount}/{totalPackagesCount}
                </span>
              </button>
            </div>

            {/* Quick Context Button for Direct Action */}
            {currentView === 'client' ? (
              <button
                onClick={() => onViewChange('admin')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-xl transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Acessar ADM</span>
              </button>
            ) : (
              <button
                onClick={() => onViewChange('client')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl transition-all shadow-sm"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Loja</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Status Bar below Header on tiny screens */}
        <div className="md:hidden flex items-center justify-between py-1.5 px-1 border-t border-slate-800/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistema Online</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">Entregas Automáticas</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Sem senha · Pix 24h</span>
          </div>
        </div>

      </div>
    </header>
  );
};
