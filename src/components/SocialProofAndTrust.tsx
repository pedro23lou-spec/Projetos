import React from 'react';
import { Lock, Zap, RefreshCw, Star, Users, HeartHandshake, Eye, Heart } from 'lucide-react';

export const SocialProofAndTrust: React.FC = () => {
  const testimonials = [
    {
      name: 'Mariana Duarte',
      handle: '@marianaduarte_arq',
      role: 'Arquiteta e Criadora de Conteúdo',
      category: 'Seguidores',
      content: 'Comprei 1.000 seguidores para dar autoridade ao meu escritório de arquitetura. O Pix aprovou na hora e em menos de 10 minutos começaram a chegar! Não pediram senha e o suporte no WhatsApp foi nota 10.',
      stars: 5,
      gain: '+1.000 Seguidores VIP'
    },
    {
      name: 'Lucas Ferreira',
      handle: '@lucasf_cortes',
      role: 'Criador de Conteúdo e Vídeos',
      category: 'Views',
      content: 'Comprei o pacote de views para alavancar um vídeo que postei. Em menos de 15 minutos o vídeo decolou e entregou mais de 10k views, gerando alcance orgânico e novos seguidores!',
      stars: 5,
      gain: '+10.000 Views Virais'
    },
    {
      name: 'Dr. Roberto Mendes',
      handle: '@clinicavita.saude',
      role: 'Clínica Médica Integrada',
      category: 'Curtidas',
      content: 'Usamos os pacotes de curtidas e views em posts de dicas de saúde. O alcance aumentou bastante e passou muito mais credibilidade e segurança aos novos pacientes.',
      stars: 5,
      gain: '+2.500 Curtidas Reais'
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-950/60 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Security & Guarantee 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">100% Sem Senha</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nunca pedimos sua senha ou acesso. Basta que sua conta esteja pública para receber o engajamento com total sigilo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Entrega Automática</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema identifica o pagamento do Pix na mesma hora e dispara a ordem em minutos, funcionando 24h por dia.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Reposição de 30 Dias</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Garantia blindada: se houver oscilações nas métricas durante 30 dias, repomos automaticamente sem cobrança extra.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Suporte no WhatsApp</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipe brasileira pronta para atender antes, durante e depois da sua compra. Você nunca fica desamparado.
            </p>
          </div>

        </div>

        {/* Big Impact Statistics Strip */}
        <div className="mb-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-black text-white font-mono tabular-nums">
                +45.000
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Pedidos Entregues
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono tabular-nums">
                99.8%
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Satisfação de Clientes
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono tabular-nums flex items-center justify-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Classificação Geral
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-4xl font-black text-cyan-400 font-mono tabular-nums">
                Zero
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Risco para sua Conta
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            Resultados Reais
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            O que dizem os clientes satisfeitos
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Veja como perfis aumentaram autoridade e engajamento com seguidores, curtidas e views.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Rating stars & gain tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {item.gain}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{item.content}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-xs text-purple-400 font-mono">{item.handle}</div>
                  <div className="text-[11px] text-slate-400">{item.role}</div>
                </div>

                <div className="text-xs font-semibold text-purple-300 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/40">
                  {item.category}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
