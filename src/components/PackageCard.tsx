import React from 'react';
import { PackageItem } from '../types';
import { Zap, Check, Clock, ShieldCheck, Flame, ArrowRight, Users, Heart, Eye } from 'lucide-react';

interface PackageCardProps {
  packageItem: PackageItem;
  onBuy: (packageItem: PackageItem) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ packageItem, onBuy }) => {
  const getCategoryDetails = () => {
    switch (packageItem.category) {
      case 'seguidores':
        return {
          label: 'Seguidores',
          badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          accentGradient: 'from-purple-600/20 via-indigo-600/10 to-transparent',
          borderColor: 'group-hover:border-purple-500/50',
          icon: <Users className="w-3.5 h-3.5 text-purple-400" />
        };
      case 'curtidas':
        return {
          label: 'Curtidas',
          badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
          accentGradient: 'from-pink-600/20 via-rose-600/10 to-transparent',
          borderColor: 'group-hover:border-pink-500/50',
          icon: <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
        };
      case 'views':
        return {
          label: 'Views (Reels/Vídeo)',
          badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          accentGradient: 'from-cyan-600/20 via-sky-600/10 to-transparent',
          borderColor: 'group-hover:border-cyan-500/50',
          icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />
        };
      default:
        return {
          label: 'Engajamento',
          badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          accentGradient: 'from-indigo-600/20 to-transparent',
          borderColor: 'group-hover:border-indigo-500/50',
          icon: <Zap className="w-3.5 h-3.5 text-indigo-400" />
        };
    }
  };

  const cat = getCategoryDetails();
  const isBestSeller = packageItem.highlightTag?.toLowerCase().includes('mais vendido');
  const discountPercent = packageItem.originalPrice
    ? Math.round(((packageItem.originalPrice - packageItem.price) / packageItem.originalPrice) * 100)
    : null;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-slate-900/90 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/30 ${
        isBestSeller
          ? 'border-purple-500/60 ring-1 ring-purple-500/30 shadow-lg shadow-purple-950/20'
          : 'border-slate-800 ' + cat.borderColor
      }`}
    >
      {/* Background Gradient Accent on Hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${cat.accentGradient} opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none`}
      />

      {/* Card Content Top */}
      <div className="relative p-5 sm:p-6 z-10">
        
        {/* Header Tags: Category + Highlight Tag */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cat.badgeBg}`}>
            {cat.icon}
            <span>{cat.label}</span>
          </div>

          {packageItem.highlightTag && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{packageItem.highlightTag}</span>
            </div>
          )}
        </div>

        {/* Package Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-200 transition-colors leading-snug">
          {packageItem.name}
        </h3>

        {/* Big Quantity Indicator */}
        <div className="mt-2 text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight font-mono tabular-nums">
          {packageItem.quantity.toLocaleString('pt-BR')}
          <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1.5 uppercase font-sans">
            {packageItem.category}
          </span>
        </div>

        {/* Delivery Time Kicker */}
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Entrega em: <strong className="text-slate-200">{packageItem.deliveryTime}</strong></span>
        </div>

        {/* Hairline Divider */}
        <div className="my-4 h-px bg-slate-800/80" />

        {/* Features Checklist */}
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
          {packageItem.features && packageItem.features.length > 0 ? (
            packageItem.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="leading-tight">{feature}</span>
              </li>
            ))
          ) : (
            <>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Início automático após Pix</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Sem necessidade de senha</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Garantia de reposição 30 dias</span>
              </li>
            </>
          )}
        </ul>

      </div>

      {/* Card Bottom / Action Zone */}
      <div className="relative p-5 sm:p-6 pt-0 z-10">
        
        {/* Price Container */}
        <div className="mb-4">
          {packageItem.originalPrice && packageItem.originalPrice > packageItem.price && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="line-through">
                R$ {packageItem.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              {discountPercent && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-semibold text-slate-400">R$</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums">
              {packageItem.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-slate-400 ml-1">pagamento único</span>
          </div>
        </div>

        {/* Required Green Action Button: COMPRAR AGORA */}
        <button
          onClick={() => onBuy(packageItem)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all cursor-pointer group/btn"
        >
          <Zap className="w-4 h-4 text-slate-950 fill-current group-hover/btn:animate-bounce" />
          <span className="tracking-wide">COMPRAR AGORA</span>
          <ArrowRight className="w-4 h-4 ml-0.5 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        {/* Micro Security Guarantee */}
        <div className="mt-2.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Entrega Imediata Garantida · Pix Seguro</span>
        </div>

      </div>

    </div>
  );
};
