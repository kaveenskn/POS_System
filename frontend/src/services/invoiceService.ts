import { apiClient } from '../lib/api';
import { productService } from './productService';
import type {
  Customer,
  CustomerCreateInput,
  CustomerListResponse,
  InvoiceCreate,
  InvoiceListResponse,
  InvoiceResponse,
} from '../types/invoice.types';

const INITIAL_MOCK_INVOICES: InvoiceResponse[] = [
  {
    id: 1,
    invoice_number: 'INV-20261106-0001',
    customer_id: null,
    customer_name: 'Walk-in Customer',
    subtotal: 10250.0,
    discount_amount: 250.0,
    total_amount: 10000.0,
    payment_method: 'cash',
    amount_paid: 10000.0,
    change_amount: 0.0,
    status: 'completed',
    notes: 'Counter walk-in customer sale',
    created_at: '2026-11-06T14:35:00Z',
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: 'Brembo Sintered Front Brake Pads',
        product_code: 'BRM-BP-001',
        unit_price: 2650.0,
        cost_price: 1850.0,
        quantity: 2,
        line_total: 5300.0,
      },
      {
        id: 2,
        product_id: 2,
        product_name: 'Motul 7100 4T 10W-40 100% Synthetic 1L',
        product_code: 'MOT-OIL-7100',
        unit_price: 4950.0,
        cost_price: 3800.0,
        quantity: 1,
        line_total: 4950.0,
      },
    ],
  },
  {
    id: 2,
    invoice_number: 'INV-20261105-0002',
    customer_id: null,
    customer_name: 'Sampath Kumara',
    subtotal: 18900.0,
    discount_amount: 0.0,
    total_amount: 18900.0,
    payment_method: 'card',
    amount_paid: 18900.0,
    change_amount: 0.0,
    status: 'completed',
    notes: 'KTM Duke 390 drive chain replacement',
    created_at: '2026-11-05T16:15:00Z',
    items: [
      {
        id: 3,
        product_id: 4,
        product_name: 'DID 520VX3 Pro-Street X-Ring Drive Chain 120L (Gold)',
        product_code: 'DID-CHN-520VX3',
        unit_price: 18900.0,
        cost_price: 14500.0,
        quantity: 1,
        line_total: 18900.0,
      },
    ],
  },
  {
    id: 3,
    invoice_number: 'INV-20261104-0003',
    customer_id: null,
    customer_name: 'Workshop Service Customer',
    subtotal: 5150.0,
    discount_amount: 300.0,
    total_amount: 4850.0,
    payment_method: 'bank_transfer',
    amount_paid: 5000.0,
    change_amount: 150.0,
    status: 'completed',
    notes: 'Full routine tune-up service kit',
    created_at: '2026-11-04T11:20:00Z',
    items: [
      {
        id: 4,
        product_id: 8,
        product_name: 'Yamaha Genuine Spin-On Engine Oil Filter',
        product_code: 'YAM-OF-21C',
        unit_price: 750.0,
        cost_price: 450.0,
        quantity: 2,
        line_total: 1500.0,
      },
      {
        id: 5,
        product_id: 3,
        product_name: 'NGK Laser Iridium Spark Plug CR9EIA-9',
        product_code: 'NGK-SPK-CR9',
        unit_price: 1825.0,
        cost_price: 1100.0,
        quantity: 2,
        line_total: 3650.0,
      },
    ],
  },
];

const INVOICES_STORAGE_KEY = 'torqueline_invoices_cache';

function getLocalInvoices(): InvoiceResponse[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage error
  }
  return [...INITIAL_MOCK_INVOICES];
}

function saveLocalInvoices(items: InvoiceResponse[]) {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage error
  }
}

export const invoiceService = {
  async searchProducts(query: string) {
    try {
      const { data } = await apiClient.get('/products', {
        params: { search: query, limit: 20 },
      });
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data;
      }
    } catch {
      // Offline fallback
    }
    return productService.getProducts({ search: query, limit: 20 });
  },

  async createInvoice(payload: InvoiceCreate): Promise<InvoiceResponse> {
    try {
      const { data } = await apiClient.post<InvoiceResponse>('/invoices', payload);
      if (data && data.id) {
        const all = getLocalInvoices();
        saveLocalInvoices([data, ...all]);
        return data;
      }
    } catch {
      // Offline fallback
    }

    const all = getLocalInvoices();
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invNumber = `INV-${today}-${String(newId).padStart(4, '0')}`;

    let localProducts: { id: number; name: string; code: string; selling_price: number; cost_price: number }[] = [];
    try {
      const raw = localStorage.getItem('torqueline_products_db');
      if (raw) localProducts = JSON.parse(raw);
    } catch {
      // ignore
    }

    let subtotal = 0;
    const invoiceItems = payload.items.map((item, idx) => {
      const p = localProducts.find((mp) => mp.id === item.product_id);
      const unitPrice = p ? p.selling_price : 1000;
      const costPrice = p ? p.cost_price : 800;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        id: idx + 1,
        product_id: item.product_id,
        product_name: p ? p.name : `Product #${item.product_id}`,
        product_code: p ? p.code : `PRD-${item.product_id}`,
        unit_price: unitPrice,
        cost_price: costPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const discount = payload.discount_amount ?? 0;
    const total = Math.max(0, subtotal - discount);
    const paid = payload.amount_paid;
    const change = Math.max(0, paid - total);

    const newInvoice: InvoiceResponse = {
      id: newId,
      invoice_number: invNumber,
      customer_id: payload.customer_id ?? null,
      customer_name: 'Walk-in Customer',
      subtotal,
      discount_amount: discount,
      total_amount: total,
      payment_method: payload.payment_method,
      amount_paid: paid,
      change_amount: change,
      status: 'completed',
      notes: payload.notes ?? null,
      created_at: new Date().toISOString(),
      items: invoiceItems,
    };

    saveLocalInvoices([newInvoice, ...all]);
    return newInvoice;
  },

  async getInvoices(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<InvoiceListResponse> {
    try {
      const { data } = await apiClient.get<InvoiceListResponse>('/invoices', { params });
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        saveLocalInvoices(data.items);
        return data;
      }
    } catch {
      // Offline fallback
    }

    let items = [...getLocalInvoices()];

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          (i.customer_name && i.customer_name.toLowerCase().includes(q))
      );
    }

    if (params?.date_from) {
      items = items.filter((i) => i.created_at.slice(0, 10) >= params.date_from!);
    }
    if (params?.date_to) {
      items = items.filter((i) => i.created_at.slice(0, 10) <= params.date_to!);
    }

    return {
      items,
      total: items.length,
    };
  },

  async getInvoice(id: number): Promise<InvoiceResponse> {
    try {
      const { data } = await apiClient.get<InvoiceResponse>(`/invoices/${id}`);
      if (data) return data;
    } catch {
      // Offline fallback
    }

    const all = getLocalInvoices();
    const found = all.find((i) => i.id === id);
    if (!found) throw new Error('Invoice not found');
    return found;
  },

  async getCustomers(search?: string): Promise<CustomerListResponse> {
    try {
      const { data } = await apiClient.get<CustomerListResponse>('/customers', {
        params: { search, limit: 50 },
      });
      if (data && Array.isArray(data.items)) return data;
    } catch {
      // Offline fallback
    }

    return {
      items: [
        { id: 1, name: 'Sampath Kumara', phone: '077 123 4567', email: 'sampath@gmail.com', created_at: new Date().toISOString() },
        { id: 2, name: 'Ranjith Motors', phone: '071 889 9001', email: 'ranjith@motors.lk', created_at: new Date().toISOString() },
      ],
      total: 2,
    };
  },

  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    try {
      const { data } = await apiClient.post<Customer>('/customers', input);
      if (data) return data;
    } catch {
      // Offline fallback
    }

    return {
      id: Date.now(),
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      created_at: new Date().toISOString(),
    };
  },
};
