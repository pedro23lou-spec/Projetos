import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const faqs: FaqItem[] = [
    {
      question: 'Preciso fornecer a senha da minha conta?',
      answer:
        'Não! Nunca solicitamos sua senha, login ou qualquer dado de acesso. Para realizar a entrega, nosso sistema inteligente precisa exclusivamente do seu @nome_de_usuario ou do link público da postagem/vídeo. Sua privacidade e segurança são garantidas a 100%.'
    },
    {
      question: 'Em quanto tempo meu pedido começa a ser entregue?',
      answer:
        'A liberação é automática e imediata após a confirmação do pagamento via Pix (que costuma levar de 5 a 15 segundos). Os pacotes menores começam a entrar em cerca de 5 a 15 minutos. Pacotes maiores são entregues de forma cadenciada e gradual para garantir máxima naturalidade ao algoritmo.'
    },
    {
      question: 'Minha conta corre algum risco de suspensão ou banimento?',
      answer:
        'Nenhum risco. Nossos métodos cumprem estritamente as diretrizes de tráfego e padrões de segurança de engajamento social. Como não exigimos credenciais ou senhas da sua conta, o algoritmo trata o engajamento como interações naturais de visitantes.'
    },
    {
      question: 'Existe garantia de reposição se houver alguma queda?',
      answer:
        'Sim! Todos os nossos pacotes contam com garantia de reposição de 30 dias. Embora utilizemos perfis com alta retenção, caso note qualquer oscilação nas suas métricas nesse período, basta acionar nosso suporte via WhatsApp que o sistema repõe automaticamente sem nenhum custo.'
    },
    {
      question: 'Como funciona o pagamento via Pix?',
      answer:
        'O Pix é o método oficial do Banco Central: instantâneo, disponível 24 horas por dia, 7 dias por semana, e sem nenhuma taxa extra. Ao clicar em "Comprar Agora", geramos na hora um QR Code e um código "Copia e Cola" exclusivo para seu pedido. Pagou, o sistema detecta e inicia o envio!'
    },
    {
      question: 'Meu perfil precisa estar em modo público?',
      answer:
        'Sim. Durante o processo de envio e entrega, o seu perfil precisa estar com a visibilidade definida como "Pública". Se a conta estiver privada, as redes bloqueiam o recebimento de interações externas de novos seguidores ou curtidas. Depois de concluída a entrega, você pode voltar para privado se desejar.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tire suas Dúvidas</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Perguntas Frequentes
        </h3>
        <p className="text-sm text-slate-400 mt-2">
          Tudo o que você precisa saber antes de impulsionar suas redes sociais.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl transition-all border ${
                isOpen
                  ? 'bg-slate-900/90 border-purple-500/40 shadow-lg shadow-purple-950/20'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-bold text-white pr-4">
                  {faq.question}
                </span>
                <div
                  className={`p-1 rounded-lg bg-slate-800 text-slate-300 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 bg-purple-600/30 text-purple-300' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 mt-1">
                  <p className="pt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
};
