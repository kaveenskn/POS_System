import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardResponse } from '../../types/dashboard.types';

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardMetrics: vi.fn(),
  },
}));

const mockDashboardData: DashboardResponse = {
  summary: {
    today_sales: 58000.0,
    today_invoices_count: 3,
    yesterday_sales: 42000.0,
    month_sales: 1850000.0,
    month_invoices_count: 142,
    total_revenue: 2450000.0,
    total_invoices_count: 188,
    total_products: 12,
    total_stock_units: 320,
    low_stock_count: 2,
    out_of_stock_count: 1,
    total_inventory_value: 890000.0,
    total_customers: 45,
  },
  sales_trend_days: [
    { date: '2026-11-04', label: 'Wed (Nov 04)', revenue: 32000.0, invoices_count: 2 },
    { date: '2026-11-05', label: 'Thu (Nov 05)', revenue: 45000.0, invoices_count: 3 },
    { date: '2026-11-06', label: 'Fri (Nov 06)', revenue: 42000.0, invoices_count: 2 },
    { date: '2026-11-07', label: 'Sat (Nov 07)', revenue: 65000.0, invoices_count: 4 },
    { date: '2026-11-08', label: 'Sun (Nov 08)', revenue: 28000.0, invoices_count: 1 },
    { date: '2026-11-09', label: 'Mon (Nov 09)', revenue: 42000.0, invoices_count: 2 },
    { date: '2026-11-10', label: 'Tue (Nov 10)', revenue: 58000.0, invoices_count: 3 },
  ],
  monthly_trend: [
    { month: '2026-06', label: 'Jun 2026', revenue: 950000.0, invoices_count: 80 },
    { month: '2026-07', label: 'Jul 2026', revenue: 1100000.0, invoices_count: 92 },
    { month: '2026-08', label: 'Aug 2026', revenue: 1350000.0, invoices_count: 105 },
    { month: '2026-09', label: 'Sep 2026', revenue: 1480000.0, invoices_count: 115 },
    { month: '2026-10', label: 'Oct 2026', revenue: 1720000.0, invoices_count: 130 },
    { month: '2026-11', label: 'Nov 2026', revenue: 1850000.0, invoices_count: 142 },
  ],
  top_selling_products: [
    {
      product_id: 1,
      product_name: 'Brembo Sintered Front Brake Pads',
      product_code: 'BRM-BP-001',
      category: 'Braking System',
      units_sold: 14,
      total_revenue: 91000.0,
      current_stock: 6,
    },
    {
      product_id: 2,
      product_name: 'Motul 7100 4T 10W-40 100% Synthetic 1L',
      product_code: 'MOT-OIL-7100',
      category: 'Oils & Lubricants',
      units_sold: 11,
      total_revenue: 54450.0,
      current_stock: 18,
    },
  ],
  recent_invoices: [
    {
      id: 101,
      invoice_number: 'INV-20261110-0001',
      created_at: '2026-11-10T08:30:00Z',
      customer_name: 'Walk-in Counter',
      total_amount: 11450.0,
      payment_method: 'cash',
      status: 'completed',
      items_count: 2,
    },
  ],
  low_stock_alerts: [
    {
      id: 5,
      name: 'NGK Laser Iridium Spark Plug CR9EIA-9',
      code: 'NGK-SP-CR9EIA',
      category: 'Electrical & Lighting',
      quantity: 2,
      min_stock_level: 5,
      unit: 'Pieces',
      cost_price: 2100.0,
      selling_price: 3200.0,
      is_out_of_stock: false,
    },
  ],
  category_distribution: [
    {
      category: 'Braking System',
      product_count: 4,
      stock_units: 85,
      inventory_value: 320000.0,
    },
    {
      category: 'Oils & Lubricants',
      product_count: 3,
      stock_units: 95,
      inventory_value: 280000.0,
    },
  ],
  last_updated: '2026-11-10T09:00:00Z',
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic metrics and elements returned from backend API', async () => {
    vi.mocked(dashboardService.getDashboardMetrics).mockResolvedValueOnce(mockDashboardData);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Initial loading state or resolved state
    await waitFor(() => {
      expect(screen.getByText('TorqueLine Moto Parts')).toBeInTheDocument();
    });

    // Check header and live indicator
    expect(screen.getByText('Live POS Active')).toBeInTheDocument();

    // Check dynamic stats cards
    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText(/58,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/3 invoices completed/)).toBeInTheDocument();

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText(/2,450,000\.00/)).toBeInTheDocument();

    expect(screen.getByText('Total Catalog Products')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    // Check top selling fast moving parts
    expect(screen.getByText('Top Fast-Moving Parts')).toBeInTheDocument();
    expect(screen.getByText('Brembo Sintered Front Brake Pads')).toBeInTheDocument();
    expect(screen.getByText('BRM-BP-001')).toBeInTheDocument();
    expect(screen.getByText('14 units sold')).toBeInTheDocument();

    // Check stock warning card
    expect(screen.getAllByText('Stock Reorder Warnings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('NGK Laser Iridium Spark Plug CR9EIA-9')).toBeInTheDocument();

    // Check recent invoices feed
    expect(screen.getByText('Recent POS Sales Feed')).toBeInTheDocument();
    expect(screen.getByText('INV-20261110-0001')).toBeInTheDocument();
    expect(screen.getByText('Walk-in Counter')).toBeInTheDocument();
  });

  it('allows switching chart time periods dynamically', async () => {
    vi.mocked(dashboardService.getDashboardMetrics).mockResolvedValueOnce(mockDashboardData);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sales & Revenue Performance')).toBeInTheDocument();
    });

    const monthButton = screen.getByRole('button', { name: /Last 6 Months/i });
    fireEvent.click(monthButton);

    // Should now display monthly labels or updated period revenue
    expect(monthButton).toHaveClass('bg-[#f04b2f]');
  });
});
