import React from 'react';
import { PackageCategory } from '../types';
import { ShieldCheck, Zap, RefreshCw, Lock, Sparkles, TrendingUp, Users, Heart, Eye } from 'lucide-react';

interface HeroSectionProps {
  selectedCategory: PackageCategory | 'all';
  onSelectCategory: (category: PackageCategory | 'all') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="relative pt-6 pb-10 sm:pt-12 sm:pb-16 overflow-hidden">
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Trust Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-xs text-purple-300 mb-5 shadow-sm shadow-purple-950/30">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-semibold tracking-wide">Tecnologia de Entrega Inteligente 2026</span>
          <span className="text-purple-600 font-bold">·</span>
          <span className="text-slate-400">Mais de 45 mil pedidos concluídos</span>
        </div>

        {/* Required Headline: Alavanque suas Redes Sociais em Segundos */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] text-balance">
          Alavanque suas Redes Sociais em{' '}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Segundos
          </span>
        </h1>

        {/* Required Subtitle: Sem necessidade de senha, pagamento rápido via Pix */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Sem necessidade de senha, pagamento rápido via Pix. Escolha entre seguidores reais, curtidas e visualizações com início imediato e garantia total.
        </p>

        {/* Trust Pills / Pillars */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-300">100% Sem Senha</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-slate-300">Início em Minutos</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-slate-300">30 Dias de Reposição</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-slate-300">Perfis Reais & Ativos</span>
          </div>
        </div>

        {/* Primary Selectors: SEGUIDORES, CURTIDAS, VIEWS */}
        <div className="mt-10 sm:mt-12">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3.5">
            O que você deseja impulsionar hoje?
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
            {/* All Packages */}
            <button
              onClick={() => onSelectCategory('all')}
              className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-100 text-slate-950 shadow-lg shadow-white/10 scale-105 ring-2 ring-white/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>Todos</span>
            </button>

            {/* SEGUIDORES */}
            <button
              onClick={() => onSelectCategory('seguidores')}
              className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === 'seguidores'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 scale-105 ring-2 ring-purple-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-purple-500/40'
              }`}
            >
              <Users className="w-4 h-4 text-purple-300" />
              <span>Seguidores</span>
            </button>

            {/* CURTIDAS */}
            <button
              onClick={() => onSelectCategory('curtidas')}
              className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === 'curtidas'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30 scale-105 ring-2 ring-pink-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-pink-500/40'
              }`}
            >
              <Heart className="w-4 h-4 text-pink-300 fill-current" />
              <span>Curtidas</span>
            </button>

            {/* VIEWS */}
            <button
              onClick={() => onSelectCategory('views')}
              className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === 'views'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/30 scale-105 ring-2 ring-cyan-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <Eye className="w-4 h-4 text-cyan-300" />
              <span>Views</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
