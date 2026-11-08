import React from 'react';
import { PackageItem, PackageCategory } from '../types';
import { PackageCard } from './PackageCard';
import { Sparkles, Layers, SlidersHorizontal, PlusCircle, Users, Heart, Eye } from 'lucide-react';

interface PackageShowcaseProps {
  packages: PackageItem[];
  selectedCategory: PackageCategory | 'all';
  onSelectCategory: (category: PackageCategory | 'all') => void;
  onBuyPackage: (item: PackageItem) => void;
  onResetFilters: () => void;
  onGoToAdmin: () => void;
}

export const PackageShowcase: React.FC<PackageShowcaseProps> = ({
  packages,
  selectedCategory,
  onSelectCategory,
  onBuyPackage,
  onResetFilters,
  onGoToAdmin,
}) => {
  // Only display active packages in the customer store
  const activePackages = packages.filter((pkg) => pkg.active);

  // Filter by category: seguidores, curtidas, views
  const filteredPackages = activePackages.filter((pkg) => {
    return selectedCategory === 'all' || pkg.category === selectedCategory;
  });

  return (
    <section id="pacotes" className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1.5">
            <Layers className="w-4 h-4" />
            <span>Vitrine de Pacotes Dinâmicos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Escolha seu Pacote de Engajamento
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Entrega expressa iniciada automaticamente após o Pix. Sem enrolação.
          </p>
        </div>

        {/* Counter of active packages */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            <strong className="text-white font-mono">{filteredPackages.length}</strong> {filteredPackages.length === 1 ? 'pacote disponível' : 'pacotes disponíveis'}
          </span>
        </div>
      </div>

      {/* Category quick pill tabs in showcase */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>Todos</span>
          <span className="font-mono text-[11px] opacity-70">
            ({activePackages.length})
          </span>
        </button>

        <button
          onClick={() => onSelectCategory('seguidores')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'seguidores'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-300" />
          <span>Seguidores</span>
          <span className="font-mono text-[11px] opacity-70">
            ({activePackages.filter((p) => p.category === 'seguidores').length})
          </span>
        </button>

        <button
          onClick={() => onSelectCategory('curtidas')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'curtidas'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-900/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-pink-300 fill-current" />
          <span>Curtidas</span>
          <span className="font-mono text-[11px] opacity-70">
            ({activePackages.filter((p) => p.category === 'curtidas').length})
          </span>
        </button>

        <button
          onClick={() => onSelectCategory('views')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'views'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-300" />
          <span>Views</span>
          <span className="font-mono text-[11px] opacity-70">
            ({activePackages.filter((p) => p.category === 'views').length})
          </span>
        </button>
      </div>

      {/* Grid of Packages */}
      {filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} packageItem={pkg} onBuy={onBuyPackage} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Nenhum pacote encontrado para esta categoria
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Experimente visualizar todas as categorias ou ative novos pacotes no Painel Administrativo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Ver Todos os Pacotes
            </button>
            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>Gerenciar Pacotes no ADM</span>
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
