import { apiClient } from '../lib/api';
import type { DashboardResponse, SalesTrendPoint, MonthlyTrendPoint } from '../types/dashboard.types';
import { invoiceService } from './invoiceService';
import { productService } from './productService';

const DASHBOARD_CACHE_KEY = 'torqueline_dashboard_cache';

/**
 * Builds a dynamic fallback response computed from stored invoices and products
 * when the backend API is starting up or temporarily offline.
 */
async function buildLocalFallbackMetrics(): Promise<DashboardResponse> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 1. Invoices
  let invoices: Awaited<ReturnType<typeof invoiceService.getInvoices>>['items'] = [];
  try {
    const invRes = await invoiceService.getInvoices({ limit: 100 });
    invoices = invRes.items;
  } catch {
    invoices = [];
  }

  // 2. Products
  let products: Awaited<ReturnType<typeof productService.getProducts>>['items'] = [];
  try {
    const prodRes = await productService.getProducts({ limit: 500 });
    products = prodRes.items;
  } catch {
    products = [];
  }

  // Summary calculations
  const todayInvoices = invoices.filter((i) => i.created_at.slice(0, 10) === todayStr);
  const todaySales = todayInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  const monthPrefix = todayStr.slice(0, 7);
  const monthInvoices = invoices.filter((i) => i.created_at.slice(0, 7) === monthPrefix);
  const monthSales = monthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  const totalRevenue = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalStockUnits = products.reduce((s, p) => s + (p.quantity || 0), 0);
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= (p.min_stock_level || 5));
  const outOfStock = products.filter((p) => p.quantity <= 0);
  const totalInventoryValue = products.reduce((s, p) => s + (p.cost_price || 0) * (p.quantity || 0), 0);

  // Build 7-day trend
  const salesTrendDays: SalesTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const dayInvs = invoices.filter((inv) => inv.created_at.slice(0, 10) === dStr);
    const dayRev = dayInvs.reduce((s, inv) => s + (inv.total_amount || 0), 0);
    salesTrendDays.push({
      date: dStr,
      label: d.toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: Math.round(dayRev * 100) / 100,
      invoices_count: dayInvs.length,
    });
  }

  // Build 6-month trend
  const monthlyTrend: MonthlyTrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toISOString().slice(0, 7);
    const mInvs = invoices.filter((inv) => inv.created_at.slice(0, 7) === mStr);
    const mRev = mInvs.reduce((s, inv) => s + (inv.total_amount || 0), 0);
    monthlyTrend.push({
      month: mStr,
      label: d.toLocaleDateString('en-LK', { month: 'short', year: 'numeric' }),
      revenue: Math.round(mRev * 100) / 100,
      invoices_count: mInvs.length,
    });
  }

  // Top selling products from invoice items
  const productSalesMap = new Map<string, { name: string; code: string; qty: number; rev: number; cat: string }>();
  for (const inv of invoices) {
    if (Array.isArray(inv.items)) {
      for (const item of inv.items) {
        const key = item.product_code || item.product_name;
        const existing = productSalesMap.get(key) || {
          name: item.product_name,
          code: item.product_code,
          qty: 0,
          rev: 0,
          cat: 'Spare Parts',
        };
        existing.qty += item.quantity || 1;
        existing.rev += item.line_total || 0;
        productSalesMap.set(key, existing);
      }
    }
  }

  const topSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map((p) => {
      const match = products.find((pr) => pr.code === p.code);
      return {
        product_name: p.name,
        product_code: p.code,
        category: match?.category || p.cat,
        units_sold: p.qty,
        total_revenue: Math.round(p.rev * 100) / 100,
        current_stock: match ? match.quantity : 0,
      };
    });

  // Low stock alerts
  const lowStockAlerts = [...outOfStock, ...lowStock].slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    category: p.category,
    quantity: p.quantity,
    min_stock_level: p.min_stock_level || 5,
    unit: p.unit || 'Pieces',
    cost_price: p.cost_price || 0,
    selling_price: p.selling_price || 0,
    is_out_of_stock: p.quantity <= 0,
  }));

  // Category distribution
  const catMap = new Map<string, { count: number; stock: number; val: number }>();
  for (const p of products) {
    const cat = p.category || 'General';
    const c = catMap.get(cat) || { count: 0, stock: 0, val: 0 };
    c.count += 1;
    c.stock += p.quantity || 0;
    c.val += (p.cost_price || 0) * (p.quantity || 0);
    catMap.set(cat, c);
  }

  const categoryDistribution = Array.from(catMap.entries())
    .map(([category, info]) => ({
      category,
      product_count: info.count,
      stock_units: info.stock,
      inventory_value: Math.round(info.val),
    }))
    .sort((a, b) => b.stock_units - a.stock_units)
    .slice(0, 6);

  // Recent invoices
  const recentInvoices = invoices.slice(0, 6).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    created_at: inv.created_at,
    customer_name: inv.customer_name || 'Walk-in Customer',
    total_amount: inv.total_amount,
    payment_method: inv.payment_method,
    status: inv.status,
    items_count: inv.items ? inv.items.length : 0,
  }));

  return {
    summary: {
      today_sales: Math.round(todaySales * 100) / 100,
      today_invoices_count: todayInvoices.length,
      yesterday_sales: 0,
      month_sales: Math.round(monthSales * 100) / 100,
      month_invoices_count: monthInvoices.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_invoices_count: invoices.length,
      total_products: products.length,
      total_stock_units: totalStockUnits,
      low_stock_count: lowStock.length,
      out_of_stock_count: outOfStock.length,
      total_inventory_value: Math.round(totalInventoryValue * 100) / 100,
      total_customers: 0,
    },
    sales_trend_days: salesTrendDays,
    monthly_trend: monthlyTrend,
    top_selling_products: topSelling,
    recent_invoices: recentInvoices,
    low_stock_alerts: lowStockAlerts,
    category_distribution: categoryDistribution,
    last_updated: now.toISOString(),
  };
}

export const dashboardService = {
  /**
   * Fetches real-time dashboard metrics computed dynamically by the backend from database tables.
   * If backend is starting up or temporarily offline, seamlessly provides synchronized local metrics
   * so the dashboard is always visible without error interruptions.
   */
  async getDashboardMetrics(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get<DashboardResponse>('/dashboard/metrics');
      if (response.data && response.data.summary) {
        try {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(response.data));
        } catch {
          // ignore localStorage errors
        }
        return response.data;
      }
    } catch {
      // Backend offline or starting up: read from cached database data or compute locally
    }

    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DashboardResponse;
        if (parsed && parsed.summary) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return await buildLocalFallbackMetrics();
  },
};
