import { SmmConfig } from '../types';

export const SMM_CONFIG_KEY = 'social_networks_smm_config_v1';

export const DEFAULT_SMM_CONFIG: SmmConfig = {
  apiUrl: 'https://fornecedorsmm.com/api/v2',
  apiKey: '',
  enabled: false,
  balance: '0.00',
  currency: 'BRL',
};

// Load SMM config from local storage
export function getSavedSmmConfig(): SmmConfig {
  try {
    const raw = localStorage.getItem(SMM_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SMM_CONFIG, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SMM_CONFIG;
}

// Save SMM config to local storage
export function saveSmmConfig(config: SmmConfig): void {
  try {
    localStorage.setItem(SMM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

// Test SMM connection & fetch balance via server proxy
export async function testSmmConnection(apiUrl: string, apiKey: string): Promise<{ success: boolean; balance?: string; currency?: string; error?: string }> {
  try {
    const res = await fetch('/api/smm/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl, apiKey }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível autenticar com o provedor SMM.',
      };
    }

    return {
      success: true,
      balance: data.balance,
      currency: data.currency || 'BRL',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro de conexão: ${err.message || 'Falha de rede'}`,
    };
  }
}

// Send order to SMM provider via server proxy
export async function sendOrderToSmm(params: {
  apiUrl: string;
  apiKey: string;
  service: string | number;
  link: string;
  quantity: number;
}): Promise<{ success: boolean; orderId?: string | number; error?: string; raw?: any }> {
  try {
    const res = await fetch('/api/smm/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Erro ao registrar pedido no provedor SMM.',
        raw: data,
      };
    }

    return {
      success: true,
      orderId: data.order,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha na requisição SMM: ${err.message}`,
    };
  }
}

// Check status of a single order in SMM provider
export async function checkSmmOrderStatus(params: {
  apiUrl?: string;
  apiKey?: string;
  orderId?: string | number;
  localOrderId?: string;
}): Promise<{
  success: boolean;
  status_smm?: string;
  raw_status?: string;
  start_count?: number | string;
  remains?: number | string;
  order?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/smm/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Não foi possível consultar o status da ordem no SMM.',
      };
    }

    return {
      success: true,
      status_smm: data.status_smm,
      raw_status: data.raw_status,
      start_count: data.start_count,
      remains: data.remains,
      order: data.order,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro ao consultar status no fornecedor: ${err.message}`,
    };
  }
}

// Sync all pending/active SMM orders with provider
export async function syncAllSmmOrders(params: {
  apiUrl?: string;
  apiKey?: string;
}): Promise<{
  success: boolean;
  totalUpdated?: number;
  pedidos?: any[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/smm/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Erro ao sincronizar ordens com o fornecedor SMM.',
      };
    }

    return {
      success: true,
      totalUpdated: data.totalUpdated,
      pedidos: data.pedidos,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro de sincronização SMM: ${err.message}`,
    };
  }
}
