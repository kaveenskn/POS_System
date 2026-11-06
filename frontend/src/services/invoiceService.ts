import { apiClient } from '../lib/api';
import type {
  Customer,
  CustomerCreateInput,
  CustomerListResponse,
  InvoiceCreate,
  InvoiceListResponse,
  InvoiceResponse,
} from '../types/invoice.types';

export const invoiceService = {
  async searchProducts(query: string) {
    const { data } = await apiClient.get('/products', {
      params: { search: query, limit: 20 },
    });
    return data;
  },

  async createInvoice(payload: InvoiceCreate): Promise<InvoiceResponse> {
    const { data } = await apiClient.post<InvoiceResponse>('/invoices', payload);
    return data;
  },

  async getInvoices(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<InvoiceListResponse> {
    const { data } = await apiClient.get<InvoiceListResponse>('/invoices', { params });
    return data;
  },

  async getInvoice(id: number): Promise<InvoiceResponse> {
    const { data } = await apiClient.get<InvoiceResponse>(`/invoices/${id}`);
    return data;
  },

  async getCustomers(search?: string): Promise<CustomerListResponse> {
    const { data } = await apiClient.get<CustomerListResponse>('/customers', {
      params: { search, limit: 50 },
    });
    return data;
  },

  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    const { data } = await apiClient.post<Customer>('/customers', input);
    return data;
  },
};

