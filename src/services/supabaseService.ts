import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pedido, SupabaseConfig } from '../types';

export const SUPABASE_CONFIG_KEY = 'social_networks_supabase_config_v1';
export const LOCAL_ORDERS_KEY = 'social_networks_pedidos_local_v1';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  enabled: false,
};

// SQL Schema script for user reference
export const SUPABASE_SQL_SCHEMA = `-- Tabela de Pedidos do Social Networks (Supabase / PostgreSQL)
CREATE TABLE IF NOT EXISTS pedidos (
  id VARCHAR(64) PRIMARY KEY,
  chave_pedido VARCHAR(128) NOT NULL,
  cliente_whatsapp VARCHAR(32) NOT NULL,
  cliente_instagram VARCHAR(64) NOT NULL,
  pacote_id VARCHAR(64),
  pacote_nome VARCHAR(255) NOT NULL,
  pacote_categoria VARCHAR(32) NOT NULL,
  quantidade INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  status_pagamento VARCHAR(32) DEFAULT 'Pendente', -- 'Pendente', 'Aprovado', 'Recusado'
  status_smm VARCHAR(32) DEFAULT 'Pendente',       -- 'Pendente', 'Enviado', 'Erro'
  order_id_fornecedor VARCHAR(64),
  mensagem_erro TEXT,
  smm_response_log TEXT,
  pix_end_to_end_id VARCHAR(128),
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_pedidos_instagram ON pedidos(cliente_instagram);
CREATE INDEX IF NOT EXISTS idx_pedidos_whatsapp ON pedidos(cliente_whatsapp);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status_pagamento, status_smm);

-- Habilitar RLS (Row Level Security) e permitir inserção pública para checkout
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON pedidos FOR UPDATE USING (true);
`;

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SUPABASE_CONFIG, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

// Get Supabase Client Instance if configured
let cachedClient: SupabaseClient | null = null;
let currentConfigHash = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  const hash = `${config.supabaseUrl}:${config.supabaseAnonKey}`;
  if (cachedClient && currentConfigHash === hash) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    currentConfigHash = hash;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Initial realistic demo orders
const INITIAL_DEMO_ORDERS: Pedido[] = [
  {
    id: 'INF-892144',
    chave_pedido: 'KEY-INF-892144-X7KZ',
    cliente_whatsapp: '(11) 98765-4321',
    cliente_instagram: '@anaclara.oficial',
    pacote_id: 'seg-1000',
    pacote_nome: '1.000 Seguidores VIP',
    pacote_categoria: 'seguidores',
    quantidade: 1000,
    valor: 34.90,
    status_pagamento: 'Aprovado',
    status_smm: 'Concluído',
    order_id_fornecedor: '8492011',
    smm_order_status: 'Completed',
    smm_start_count: 3200,
    smm_remains: 0,
    smm_last_checked: new Date(Date.now() - 5 * 60 * 1000).toLocaleString('pt-BR'),
    pix_end_to_end_id: 'E3265812020261107142098ab3412',
    data_hora: new Date(Date.now() - 35 * 60 * 1000).toLocaleString('pt-BR'),
  },
  {
    id: 'INF-741029',
    chave_pedido: 'KEY-INF-741029-P9LW',
    cliente_whatsapp: '(21) 99123-8877',
    cliente_instagram: '@felipe_fitness',
    pacote_id: 'curt-1000',
    pacote_nome: '1.000 Curtidas Reais',
    pacote_categoria: 'curtidas',
    quantidade: 1000,
    valor: 14.90,
    status_pagamento: 'Aprovado',
    status_smm: 'Em progresso',
    order_id_fornecedor: '8492044',
    smm_order_status: 'In progress',
    smm_start_count: 540,
    smm_remains: 120,
    smm_last_checked: new Date(Date.now() - 2 * 60 * 1000).toLocaleString('pt-BR'),
    pix_end_to_end_id: 'E3265812020261107135087cd5633',
    data_hora: new Date(Date.now() - 75 * 60 * 1000).toLocaleString('pt-BR'),
  },
  {
    id: 'INF-510928',
    chave_pedido: 'KEY-INF-510928-M2RT',
    cliente_whatsapp: '(31) 97722-1100',
    cliente_instagram: '@loja.modafem',
    pacote_id: 'views-10000',
    pacote_nome: '10.000 Views Virais',
    pacote_categoria: 'views',
    quantidade: 10000,
    valor: 19.90,
    status_pagamento: 'Aprovado',
    status_smm: 'Erro',
    mensagem_erro: 'Serviço temporariamente indisponível no provedor SMM (Código: #1042)',
    smm_response_log: '{"error":"Service 1042 is temporarily disabled or maintenance"}',
    pix_end_to_end_id: 'E3265812020261107114099ef7890',
    data_hora: new Date(Date.now() - 140 * 60 * 1000).toLocaleString('pt-BR'),
  },
  {
    id: 'INF-630129',
    chave_pedido: 'KEY-INF-630129-Q4TY',
    cliente_whatsapp: '(41) 98833-2211',
    cliente_instagram: '@pedro.barber',
    pacote_id: 'seg-500',
    pacote_nome: '500 Seguidores Brasileiros',
    pacote_categoria: 'seguidores',
    quantidade: 500,
    valor: 19.90,
    status_pagamento: 'Aprovado',
    status_smm: 'Cancelado',
    order_id_fornecedor: '8492099',
    smm_order_status: 'Canceled',
    smm_remains: 500,
    mensagem_erro: 'Link inválido ou perfil bloqueado',
    pix_end_to_end_id: 'E3265812020261107101533aa1122',
    data_hora: new Date(Date.now() - 12 * 60 * 1000).toLocaleString('pt-BR'),
  },
];

// Helper to sanitize an order object
export function sanitizeOrder(p: any): Pedido {
  return {
    id: String(p?.id || `INF-${Math.floor(100000 + Math.random() * 900000)}`),
    chave_pedido: String(p?.chave_pedido || `KEY-${p?.id || 'PEDIDO'}-AUTO`),
    cliente_whatsapp: String(p?.cliente_whatsapp || 'Não informado'),
    cliente_instagram: String(p?.cliente_instagram || '@cliente'),
    pacote_id: String(p?.pacote_id || 'pkg-default'),
    pacote_nome: String(p?.pacote_nome || 'Pacote de Engajamento'),
    pacote_categoria: p?.pacote_categoria || 'seguidores',
    quantidade: Math.max(0, Number(p?.quantidade) || 0),
    valor: Math.max(0, Number(p?.valor) || 0),
    status_pagamento: (p?.status_pagamento === 'Aprovado' || p?.status_pagamento === 'Recusado') ? p.status_pagamento : 'Pendente',
    status_smm: ['Pendente', 'Enviado', 'Em progresso', 'Concluído', 'Cancelado', 'Parcial', 'Erro'].includes(p?.status_smm) ? p.status_smm : 'Pendente',
    order_id_fornecedor: p?.order_id_fornecedor,
    smm_order_status: p?.smm_order_status ? String(p.smm_order_status) : undefined,
    smm_start_count: p?.smm_start_count !== undefined ? p.smm_start_count : undefined,
    smm_remains: p?.smm_remains !== undefined ? p.smm_remains : undefined,
    smm_last_checked: p?.smm_last_checked ? String(p.smm_last_checked) : undefined,
    mensagem_erro: p?.mensagem_erro,
    smm_response_log: p?.smm_response_log,
    pix_end_to_end_id: p?.pix_end_to_end_id,
    data_hora: String(p?.data_hora || new Date().toLocaleString('pt-BR')),
  };
}

// Helper to get local fallback orders
function getLocalOrders(): Pedido[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeOrder);
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_DEMO_ORDERS.map(sanitizeOrder);
}

// Helper to save local orders
function setLocalOrders(orders: Pedido[]): void {
  try {
    const sanitized = orders.map(sanitizeOrder);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore
  }
}

// Fetch all orders (Supabase -> Server API -> Local Storage fallback)
export async function fetchPedidos(): Promise<Pedido[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('pedidos')
        .select('*')
        .order('data_hora', { ascending: false });

      if (!error && data && data.length > 0) {
        const sanitized = (data as any[]).map(sanitizeOrder);
        setLocalOrders(sanitized);
        return sanitized;
      }
    } catch (err) {
      console.warn('Erro ao consultar Supabase, usando fallback:', err);
    }
  }

  // Fallback to Express backend server
  try {
    const res = await fetch('/api/pedidos');
    if (res.ok) {
      const json = await res.json();
      if (json.pedidos && Array.isArray(json.pedidos) && json.pedidos.length > 0) {
        const sanitized = (json.pedidos as any[]).map(sanitizeOrder);
        setLocalOrders(sanitized);
        return sanitized;
      }
    }
  } catch {
    // ignore
  }

  return getLocalOrders();
}

// Save a new order
export async function savePedido(pedido: Pedido): Promise<Pedido> {
  // 1. Update local storage immediately for responsive UI
  const current = getLocalOrders();
  const exists = current.findIndex((p) => p.id === pedido.id);
  let updated: Pedido[];
  if (exists >= 0) {
    updated = current.map((p) => (p.id === pedido.id ? pedido : p));
  } else {
    updated = [pedido, ...current];
  }
  setLocalOrders(updated);

  // 2. Persist to Express backend
  try {
    await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
  } catch {
    // ignore
  }

  // 3. Persist to Supabase if enabled
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('pedidos').upsert([pedido]);
    } catch (err) {
      console.warn('Erro ao salvar no Supabase:', err);
    }
  }

  return pedido;
}

// Update existing order (status, logs, etc.)
export async function updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido | null> {
  const current = getLocalOrders();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const merged: Pedido = { ...current[index], ...updates };
  current[index] = merged;
  setLocalOrders([...current]);

  try {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('pedidos').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Erro ao atualizar no Supabase:', err);
    }
  }

  return merged;
}
