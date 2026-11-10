import { apiClient } from '../lib/api';
import type { Customer, InvoiceResponse, PaymentMethod } from '../types/invoice.types';

export interface WholesaleStats {
  client_count: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface WholesaleClient extends Customer {
  company_name?: string | null;
  address?: string | null;
  total_orders?: number;
  total_spent?: number;
}

export interface WholesaleClientCreateInput {
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface WholesaleClientListResponse {
  items: WholesaleClient[];
  total: number;
}

export interface WholesaleOrderItemInput {
  product_id: number;
  quantity: number;
  unit_price?: number;
}

export interface WholesaleOrderCreateInput {
  customer_id: number;
  items: WholesaleOrderItemInput[];
  discount_amount?: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  notes?: string;
}

const CLIENTS_STORAGE_KEY = 'torqueline_wholesale_clients_cache';
const ORDERS_STORAGE_KEY = 'torqueline_wholesale_orders_cache';

const getLocalClients = (): WholesaleClient[] => {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalClients = (clients: WholesaleClient[]): void => {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch {
    // Ignore storage errors
  }
};

const getLocalOrders = (): InvoiceResponse[] => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalOrders = (orders: InvoiceResponse[]): void => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage errors
  }
};

export const wholesaleService = {
  async getStats(): Promise<WholesaleStats> {
    try {
      const { data } = await apiClient.get<WholesaleStats>('/wholesale/stats');
      if (data) return data;
    } catch {
      // Offline fallback
    }

    const clients = getLocalClients();
    const orders = getLocalOrders();
    const totalRev = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    return {
      client_count: clients.length,
      total_orders: orders.length,
      total_revenue: totalRev,
      avg_order_value: orders.length > 0 ? totalRev / orders.length : 0,
    };
  },

  async getClients(search?: string, skip = 0, limit = 50): Promise<WholesaleClientListResponse> {
    try {
      const { data } = await apiClient.get<WholesaleClientListResponse>('/wholesale/clients', {
        params: { search, skip, limit },
      });
      if (data && Array.isArray(data.items)) {
        saveLocalClients(data.items);
        return data;
      }
    } catch {
      // Offline fallback
    }

    let items = getLocalClients();
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company_name && c.company_name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    return {
      items,
      total: items.length,
    };
  },

  async createClient(input: WholesaleClientCreateInput): Promise<WholesaleClient> {
    try {
      const { data } = await apiClient.post<WholesaleClient>('/wholesale/clients', input);
      if (data) {
        const local = getLocalClients();
        saveLocalClients([data, ...local.filter((c) => c.id !== data.id)]);
        return data;
      }
    } catch {
      // Offline fallback
    }

    const newClient: WholesaleClient = {
      id: Date.now(),
      name: input.name,
      company_name: input.company_name ?? null,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      created_at: new Date().toISOString(),
      total_orders: 0,
      total_spent: 0,
    };
    const local = getLocalClients();
    saveLocalClients([newClient, ...local]);
    return newClient;
  },

  async getOrders(params?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ items: InvoiceResponse[]; total: number }> {
    try {
      const { data } = await apiClient.get<{ items: InvoiceResponse[]; total: number }>(
        '/wholesale/orders',
        { params }
      );
      if (data && Array.isArray(data.items)) {
        saveLocalOrders(data.items);
        return data;
      }
    } catch {
      // Offline fallback
    }

    let items = getLocalOrders();
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (o) =>
          o.invoice_number.toLowerCase().includes(q) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.notes && o.notes.toLowerCase().includes(q))
      );
    }
    return {
      items,
      total: items.length,
    };
  },

  async createOrder(payload: WholesaleOrderCreateInput): Promise<InvoiceResponse> {
    try {
      const { data } = await apiClient.post<InvoiceResponse>('/wholesale/orders', payload);
      if (data) {
        const local = getLocalOrders();
        saveLocalOrders([data, ...local]);
        return data;
      }
    } catch {
      // Offline fallback
    }

    const clients = getLocalClients();
    const client = clients.find((c) => c.id === payload.customer_id);

    const newOrder: InvoiceResponse = {
      id: Date.now(),
      invoice_number: `WHL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        Math.random() * 9000 + 1000
      )}`,
      customer_id: payload.customer_id,
      customer_name: client?.company_name || client?.name || 'Wholesale Client',
      subtotal: payload.items.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0),
      discount_amount: payload.discount_amount ?? 0,
      total_amount: Math.max(
        0,
        payload.items.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0) -
          (payload.discount_amount ?? 0)
      ),
      payment_method: payload.payment_method,
      amount_paid: payload.amount_paid,
      change_amount: Math.max(
        0,
        payload.amount_paid -
          (payload.items.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0) -
            (payload.discount_amount ?? 0))
      ),
      status: 'completed',
      notes: payload.notes ?? null,
      created_at: new Date().toISOString(),
      items: payload.items.map((it, idx) => ({
        id: idx + 1,
        product_id: it.product_id,
        product_name: `Product #${it.product_id}`,
        product_code: `PRD-${it.product_id}`,
        unit_price: it.unit_price ?? 0,
        cost_price: (it.unit_price ?? 0) * 0.75,
        quantity: it.quantity,
        line_total: (it.unit_price ?? 0) * it.quantity,
      })),
    };

    const local = getLocalOrders();
    saveLocalOrders([newOrder, ...local]);
    return newOrder;
  },
};
