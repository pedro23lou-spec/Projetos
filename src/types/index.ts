export type PackageCategory = 'seguidores' | 'curtidas' | 'views';

export interface PackageItem {
  id: string;
  name: string;
  category: PackageCategory;
  quantity: number;
  price: number;
  originalPrice?: number;
  highlightTag?: string; // e.g. "Mais Vendido", "Promoção", "Super Desconto", "Entrega Rápida"
  deliveryTime: string; // e.g. "5 a 15 minutos"
  active: boolean; // toggle to show or hide on store
  features: string[];
  serviceId?: string | number; // ID numérico do serviço no fornecedor SMM (ex: 1042)
  createdAt: number;
}

export interface InfinitePayConfig {
  merchantName: string;
  pixKey: string;
  pixKeyType: 'cnpj' | 'email' | 'phone' | 'random';
  apiKey: string; // Chave de API / Token InfinitePay
  webhookSecret: string; // Chave do Webhook de confirmação
  paymentLinkUrl: string; // e.g. https://link.infinitepay.io/socialnetworks
  checkoutMode: 'modal_qr' | 'payment_link'; // modal com QR code ou link direto
  autoVerifyEnabled: boolean; // Se true, o sistema sonda e aprova automaticamente
  autoVerifySeconds: number; // Intervalo para simular o recebimento bancário real (ex: 12 segundos)
  enabled: boolean;
}

export interface SmmConfig {
  apiUrl: string; // URL da API do fornecedor SMM (ex: https://fornecedorsmm.com/api/v2)
  apiKey: string; // Chave API do Provedor SMM
  enabled: boolean;
  balance?: string; // Saldo retornado pelo fornecedor
  currency?: string; // Moeda (BRL / USD)
  lastTestedAt?: number;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enabled: boolean;
}

export type StatusPagamento = 'Pendente' | 'Aprovado' | 'Recusado';
export type StatusSmm = 'Pendente' | 'Enviado' | 'Em progresso' | 'Concluído' | 'Cancelado' | 'Parcial' | 'Erro';

export interface Pedido {
  id: string; // ex: INF-123456
  chave_pedido: string; // ex: KEY-INF-123456-ABCD
  cliente_whatsapp: string;
  cliente_instagram: string;
  pacote_id: string;
  pacote_nome: string;
  pacote_categoria: PackageCategory;
  quantidade: number;
  valor: number;
  status_pagamento: StatusPagamento;
  status_smm: StatusSmm;
  order_id_fornecedor?: string | number;
  smm_order_status?: string; // Status retornado pela API do SMM (ex: "In progress", "Completed", "Canceled", "Partial", "Pending")
  smm_start_count?: number | string; // Contagem inicial registrada no fornecedor
  smm_remains?: number | string; // Quantidade restante para entrega
  smm_last_checked?: string; // Data e hora da última verificação de status no fornecedor
  mensagem_erro?: string;
  smm_response_log?: string;
  pix_end_to_end_id?: string;
  checkout_id?: string; // ID da cobrança dinâmica InfinitePay
  transaction_id?: string; // ID da transação InfinitePay
  data_hora: string;
}

export interface CheckoutData {
  packageItem: PackageItem;
  profileOrPostUrl: string;
  whatsapp: string;
  email?: string;
  pixCode: string;
  orderId: string;
  orderKey: string; // Chave única de autenticação do pedido
  pixEndToEndId: string; // Chave E2E do Pix (Bacen)
  status: 'form' | 'pix_generated' | 'completed';
  createdAt: number;
  verifiedAt?: number;
}

export interface AdminStats {
  totalPackages: number;
  activePackages: number;
  bestSeller: string;
  averagePrice: number;
}

