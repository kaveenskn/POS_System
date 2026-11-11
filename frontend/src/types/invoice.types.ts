// Customer / Wholesale Client types
export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company_name?: string | null;
  address?: string | null;
  created_at: string;
}

export interface CustomerCreateInput {
  name: string;
  phone?: string;
  email?: string;
  company_name?: string;
  address?: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
}

// Invoice / Sales types
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';
export type InvoiceStatus = 'draft' | 'completed';
export type DiscountType = 'percentage' | 'fixed';

export interface InvoiceItemCreate {
  product_id: number;
  quantity: number;
  unit_price?: number;
  discount_amount?: number;
}

export interface InvoiceCreate {
  customer_id?: number;
  items: InvoiceItemCreate[];
  discount_amount?: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  notes?: string;
}

export interface InvoiceItemResponse {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  discount_amount?: number;
  line_total: number;
}

export interface InvoiceResponse {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  items: InvoiceItemResponse[];
  created_at: string;
}

export interface InvoiceListResponse {
  items: InvoiceResponse[];
  total: number;
}

// Cart item (frontend only — not persisted until sale is completed)
export interface CartItem {
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  cost_price: number;
  available_stock: number;
  quantity: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  line_total: number;
}

