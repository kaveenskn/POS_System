export interface DashboardSummary {
  today_sales: number;
  today_invoices_count: number;
  yesterday_sales: number;
  month_sales: number;
  month_invoices_count: number;
  total_revenue: number;
  total_invoices_count: number;
  total_products: number;
  total_stock_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
  total_customers: number;
}

export interface SalesTrendPoint {
  date: string;
  label: string;
  revenue: number;
  invoices_count: number;
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  revenue: number;
  invoices_count: number;
}

export interface TopSellingProduct {
  product_id?: number | null;
  product_name: string;
  product_code: string;
  category: string;
  units_sold: number;
  total_revenue: number;
  current_stock: number;
}

export interface RecentActivity {
  id: number;
  invoice_number: string;
  created_at: string;
  customer_name?: string | null;
  total_amount: number;
  payment_method: string;
  status: string;
  items_count: number;
}

export interface LowStockAlert {
  id: number;
  name: string;
  code: string;
  category: string;
  quantity: number;
  min_stock_level: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  is_out_of_stock: boolean;
}

export interface CategoryBreakdown {
  category: string;
  product_count: number;
  stock_units: number;
  inventory_value: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  sales_trend_days: SalesTrendPoint[];
  monthly_trend: MonthlyTrendPoint[];
  top_selling_products: TopSellingProduct[];
  recent_invoices: RecentActivity[];
  low_stock_alerts: LowStockAlert[];
  category_distribution: CategoryBreakdown[];
  last_updated: string;
}

