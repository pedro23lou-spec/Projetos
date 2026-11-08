import React from 'react';
import { Zap, ShieldCheck, Lock, ExternalLink, LayoutDashboard, QrCode } from 'lucide-react';

interface FooterProps {
  onGoToAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onGoToAdmin }) => {
  return (
    <footer className="bg-[#060910] border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <span className="text-base font-extrabold text-white">
                Social <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Networks</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Plataforma líder em automação e engajamento estratégico para redes sociais. Conquiste autoridade, alcance e relevância imediata com pagamento Pix sem complicações.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pix Instantâneo 24/7</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>100% Sem Senha</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Navegação Rápida</h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#pacotes" className="hover:text-purple-300 transition-colors">
                  Ver Todos os Pacotes
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-purple-300 transition-colors">
                  Perguntas Frequentes (FAQ)
                </a>
              </li>
              <li>
                <button
                  onClick={onGoToAdmin}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Painel Administrativo (ADM)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Payments & Security */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Pagamento 100% Seguro</h5>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <span className="text-emerald-400 font-black text-sm">∞</span>
                <span>Checkout InfinitePay (Pix)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Processamento instantâneo via CloudWalk e Banco Central. Liberação do pedido em segundos.
              </p>
            </div>
          </div>

        </div>

        {/* Legal Disclaimer */}
        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} Social Networks. Todos os direitos reservados. CNPJ 00.000.000/0001-00.</p>
          <p className="text-slate-400 text-center sm:text-right">
            Serviço independente para gestão e otimização de engajamento social.
          </p>
        </div>

      </div>
    </footer>
  );
};
