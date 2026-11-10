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

const INVOICES_STORAGE_KEY = 'torqueline_invoices_cache';
const CUSTOMERS_STORAGE_KEY = 'torqueline_customers_cache';

function getLocalInvoices(): InvoiceResponse[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge any legacy hardcoded mock entries from previous sessions
        return parsed.filter(
          (i) => !(i.id <= 3 && (i.total_amount === 10000 || i.total_amount === 18900 || i.total_amount === 4850))
        );
      }
    }
  } catch {
    // Ignore localStorage error
  }
  return [];
}

function saveLocalInvoices(items: InvoiceResponse[]) {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage error
  }
}

function getLocalCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore localStorage error
  }
  return [];
}

function saveLocalCustomers(items: Customer[]) {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(items));
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

  /**
   * Find a product by its exact barcode.
   * First tries the backend barcode-scan endpoint, then falls back
   * to the local product store searching by barcode field.
   */
  async findByBarcode(barcode: string) {
    try {
      const product = await productService.getProductByBarcode(barcode);
      if (product && product.id) return product;
    } catch {
      // Not found on backend or backend offline — search locally
    }

    // Fallback: search local product store by barcode or product code
    const result = await productService.getProducts({ search: barcode, limit: 50 });
    if (result && Array.isArray(result.items)) {
      // Exact barcode match first
      const exactBarcode = result.items.find(
        (p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()
      );
      if (exactBarcode) return exactBarcode;

      // Exact code match
      const exactCode = result.items.find(
        (p) => p.code && p.code.toLowerCase() === barcode.toLowerCase()
      );
      if (exactCode) return exactCode;

      // Return first result if anything matches
      if (result.items.length === 1) return result.items[0];
    }

    return null;
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
      if (data && Array.isArray(data.items)) {
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
      if (data && Array.isArray(data.items)) {
        saveLocalCustomers(data.items);
        return data;
      }
    } catch {
      // Offline fallback
    }

    const items = getLocalCustomers();
    return {
      items,
      total: items.length,
    };
  },

  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    try {
      const { data } = await apiClient.post<Customer>('/customers', input);
      if (data) {
        const local = getLocalCustomers();
        saveLocalCustomers([data, ...local]);
        return data;
      }
    } catch {
      // Offline fallback
    }

    const newCustomer: Customer = {
      id: Date.now(),
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      created_at: new Date().toISOString(),
    };
    const local = getLocalCustomers();
    saveLocalCustomers([newCustomer, ...local]);
    return newCustomer;
  },
};
