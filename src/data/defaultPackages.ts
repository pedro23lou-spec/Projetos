import { PackageItem } from '../types';

export const DEFAULT_PACKAGES: PackageItem[] = [
  // ================= SEGUIDORES =================
  {
    id: 'seg-500',
    name: '500 Seguidores Brasileiros',
    category: 'seguidores',
    quantity: 500,
    price: 19.90,
    originalPrice: 34.90,
    highlightTag: 'Mais Vendido',
    deliveryTime: '5 a 15 minutos',
    active: true,
    serviceId: '101',
    features: [
      'Perfis Reais & Brasileiros',
      'Início Automático em Minutos',
      'Sem necessidade de senha',
      'Garantia de reposição 30 dias'
    ],
    createdAt: 1710000000000
  },
  {
    id: 'seg-1000',
    name: '1.000 Seguidores VIP',
    category: 'seguidores',
    quantity: 1000,
    price: 34.90,
    originalPrice: 59.90,
    highlightTag: 'Promoção',
    deliveryTime: '10 a 25 minutos',
    active: true,
    serviceId: '102',
    features: [
      'Alta retenção e qualidade VIP',
      'Não precisa informar senha',
      'Reposição automática 30 dias',
      'Suporte prioritário via WhatsApp'
    ],
    createdAt: 1710000001000
  },
  {
    id: 'seg-2500',
    name: '2.500 Seguidores Premium',
    category: 'seguidores',
    quantity: 2500,
    price: 79.90,
    originalPrice: 129.90,
    highlightTag: 'Super Desconto',
    deliveryTime: '20 a 45 minutos',
    active: true,
    serviceId: '103',
    features: [
      'Perfis brasileiros ativos',
      'Entrega segura e gradual',
      'Gera autoridade instantânea',
      'Garantia blindada 30 dias'
    ],
    createdAt: 1710000002000
  },
  {
    id: 'seg-5000',
    name: '5.000 Seguidores Turbo',
    category: 'seguidores',
    quantity: 5000,
    price: 149.90,
    originalPrice: 249.90,
    highlightTag: 'Mais Popular',
    deliveryTime: '1 a 3 horas',
    active: true,
    serviceId: '104',
    features: [
      'Impulso massivo de credibilidade',
      'Entrega cadenciada e natural',
      'Reposição garantida',
      'Atendimento VIP exclusivo'
    ],
    createdAt: 1710000003000
  },

  // ================= CURTIDAS =================
  {
    id: 'curt-500',
    name: '500 Curtidas Reais',
    category: 'curtidas',
    quantity: 500,
    price: 9.90,
    originalPrice: 16.90,
    highlightTag: 'Entrega Rápida',
    deliveryTime: '3 a 8 minutos',
    active: true,
    serviceId: '201',
    features: [
      'Válido para fotos ou Reels',
      'Perfis reais com fotos',
      'Início imediato após Pix',
      'Pode dividir em até 2 posts'
    ],
    createdAt: 1710000004000
  },
  {
    id: 'curt-1000',
    name: '1.000 Curtidas Reais',
    category: 'curtidas',
    quantity: 1000,
    price: 14.90,
    originalPrice: 24.90,
    highlightTag: 'Mais Vendido',
    deliveryTime: '5 a 12 minutos',
    active: true,
    serviceId: '202',
    features: [
      'Impulsiona engajamento no algoritmo',
      'Perfis brasileiros autênticos',
      'Início automático 24h',
      'Pode dividir em até 3 posts'
    ],
    createdAt: 1710000005000
  },
  {
    id: 'curt-2500',
    name: '2.500 Curtidas VIP',
    category: 'curtidas',
    quantity: 2500,
    price: 29.90,
    originalPrice: 49.90,
    highlightTag: 'Promoção',
    deliveryTime: '10 a 20 minutos',
    active: true,
    serviceId: '203',
    features: [
      'Perfeito para fotos de lançamentos',
      'Alta visibilidade na aba Explorar',
      'Não precisa de senha',
      'Divisão em até 5 posts'
    ],
    createdAt: 1710000006000
  },
  {
    id: 'curt-5000',
    name: '5.000 Curtidas Bombásticas',
    category: 'curtidas',
    quantity: 5000,
    price: 49.90,
    originalPrice: 89.90,
    highlightTag: 'Super Desconto',
    deliveryTime: '15 a 35 minutos',
    active: true,
    serviceId: '204',
    features: [
      'Gera efeito manada no seu perfil',
      'Entrega segura e acelerada',
      'Garantia e reposição total',
      'Divisão em até 10 publicações'
    ],
    createdAt: 1710000007000
  },

  // ================= VIEWS (VISUALIZAÇÕES) =================
  {
    id: 'views-1000',
    name: '1.000 Views em Reels',
    category: 'views',
    quantity: 1000,
    price: 4.90,
    originalPrice: 9.90,
    highlightTag: 'Super Econômico',
    deliveryTime: '2 a 5 minutos',
    active: true,
    serviceId: '301',
    features: [
      'Entrega ultra rápida em minutos',
      'Basta colar o link do Reel/Vídeo',
      'Ajuda a impulsionar para o feed',
      '100% seguro sem senha'
    ],
    createdAt: 1710000008000
  },
  {
    id: 'views-5000',
    name: '5.000 Views em Reels',
    category: 'views',
    quantity: 5000,
    price: 12.90,
    originalPrice: 22.90,
    highlightTag: 'Mais Vendido',
    deliveryTime: '3 a 8 minutos',
    active: true,
    serviceId: '302',
    features: [
      'Aumenta o alcance orgânico',
      'Entrega 100% natural',
      'Basta enviar o link do Reel',
      'Melhora métrica de engajamento'
    ],
    createdAt: 1710000009000
  },
  {
    id: 'views-10000',
    name: '10.000 Views Virais',
    category: 'views',
    quantity: 10000,
    price: 19.90,
    originalPrice: 34.90,
    highlightTag: 'Viralize Agora',
    deliveryTime: '5 a 15 minutos',
    active: true,
    serviceId: '303',
    features: [
      'Ativa o algoritmo de recomendação',
      'Visualizações de alta retenção',
      'Ideal para vídeos comerciais e trends',
      'Início imediato pós-Pix'
    ],
    createdAt: 1710000010000
  },
  {
    id: 'views-25000',
    name: '25.000 Views Turbo',
    category: 'views',
    quantity: 25000,
    price: 39.90,
    originalPrice: 69.90,
    highlightTag: 'Promoção',
    deliveryTime: '10 a 25 minutos',
    active: true,
    serviceId: '304',
    features: [
      'Efeito viral imediato no seu vídeo',
      'Alta retenção e visualização completa',
      'Perfeito para influenciadores',
      'Garantia de entrega 100%'
    ],
    createdAt: 1710000011000
  }
];
