export type ReportDatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'custom';

export type ReportCategoryKey = 'sales' | 'inventory' | 'purchases';

export type ReportId =
  // Sales Reports (4)
  | 'daily_sales'
  | 'weekly_sales'
  | 'monthly_sales'
  | 'yearly_sales'
  // Inventory Reports (3)
  | 'current_stock'
  | 'low_stock'
  | 'out_of_stock'
  // Purchase Reports (4)
  | 'purchase_by_supplier'
  | 'purchase_by_product'
  | 'purchase_history'
  | 'supplier_payments';

// --- SALES REPORT TYPES ---
export interface SaleItemDetail {
  id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleRecord {
  id: number;
  invoice_number: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  cashier_name: string;
  customer_name?: string | null;
  items_count: number;
  items?: SaleItemDetail[];
}

export interface SalesReportSummary {
  total_sales_amount: number;
  number_of_transactions: number;
  products_sold_count: number;
  total_discounts: number;
}

export interface SalesReportResponse {
  period: string;
  start_date: string;
  end_date: string;
  summary: SalesReportSummary;
  sales: SaleRecord[];
}

// --- INVENTORY REPORT TYPES ---
export interface CurrentStockItem {
  product_name: string;
  sku: string;
  category: string;
  current_quantity: number;
  purchase_price: number;
  selling_price: number;
  stock_value: number;
}

export interface CurrentStockReportResponse {
  total_stock_value: number;
  total_items_count: number;
  items: CurrentStockItem[];
}

export interface LowStockItem {
  product_name: string;
  sku: string;
  current_quantity: number;
  low_stock_level: number;
  stock_status: string;
}

export interface LowStockReportResponse {
  low_stock_count: number;
  items: LowStockItem[];
}

export interface OutOfStockItem {
  product_name: string;
  sku: string;
  category: string;
  brand: string;
  last_stock_availability?: string | null;
}

export interface OutOfStockReportResponse {
  out_of_stock_count: number;
  items: OutOfStockItem[];
}

// --- PURCHASE REPORT TYPES ---
export interface PurchaseBySupplierItem {
  supplier_name: string;
  number_of_purchases: number;
  total_purchase_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

export interface PurchaseBySupplierResponse {
  total_purchases_amount: number;
  total_outstanding: number;
  suppliers: PurchaseBySupplierItem[];
}

export interface PurchaseByProductItem {
  product_name: string;
  sku: string;
  quantity_purchased: number;
  total_purchase_cost: number;
  last_purchase_date?: string | null;
}

export interface PurchaseByProductResponse {
  total_cost: number;
  total_units_purchased: number;
  products: PurchaseByProductItem[];
}

export interface PurchaseHistoryItem {
  id: number;
  purchase_number: string;
  supplier_name: string;
  purchase_date: string;
  total_amount: number;
  payment_status: string;
}

export interface PurchaseHistoryResponse {
  total_amount: number;
  purchases: PurchaseHistoryItem[];
}

export interface SupplierPaymentRecord {
  id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
}

export interface SupplierPaymentItem {
  supplier_name: string;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  payments: SupplierPaymentRecord[];
}

export interface SupplierPaymentResponse {
  total_paid: number;
  total_outstanding: number;
  suppliers: SupplierPaymentItem[];
}

export interface ReportOverviewResponse {
  sales_total: number;
  transactions_count: number;
  stock_value: number;
  total_stock_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_payables: number;
  total_paid_suppliers: number;
}

