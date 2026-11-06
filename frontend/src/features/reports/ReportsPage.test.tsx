import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ReportsPage } from './ReportsPage';
import { reportService } from '../../services/reportService';

describe('ReportsPage & Analytics Module', () => {
  beforeEach(() => {
    vi.spyOn(reportService, 'getOverview').mockResolvedValue({
      sales_total: 15450,
      transactions_count: 3,
      stock_value: 125000,
      total_stock_items: 45,
      low_stock_count: 2,
      out_of_stock_count: 1,
      pending_payables: 18200,
      total_paid_suppliers: 32000,
    });

    vi.spyOn(reportService, 'getSalesReport').mockResolvedValue({
      period: 'daily',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      summary: {
        total_sales_amount: 15450,
        number_of_transactions: 3,
        products_sold_count: 5,
        total_discounts: 400,
      },
      sales: [
        {
          id: 1,
          invoice_number: 'INV-2026-1042',
          sale_date: new Date().toISOString(),
          subtotal: 5300,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 5300,
          payment_method: 'Cash',
          cashier_name: 'Admin',
          customer_name: 'Kamal Perera',
          items_count: 2,
        },
      ],
    });

    vi.spyOn(reportService, 'getCurrentStockReport').mockResolvedValue({
      total_stock_value: 125000,
      total_items_count: 45,
      items: [
        {
          product_name: 'Brembo Sintered Front Brake Pads',
          sku: 'BRM-BP-001',
          category: 'Braking System',
          current_quantity: 18,
          purchase_price: 1850,
          selling_price: 2650,
          stock_value: 33300,
        },
      ],
    });
  });

  it('renders the Reports dashboard with all 3 categories and 11 report options', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    // Title & Subtitle
    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(
      screen.getByText(/View and analyze your shop's sales, inventory, and purchase activities/i)
    ).toBeInTheDocument();

    // 3 Category Headings
    expect(screen.getByText('Sales Reports')).toBeInTheDocument();
    expect(screen.getByText('Inventory Reports')).toBeInTheDocument();
    expect(screen.getByText('Purchase Reports')).toBeInTheDocument();

    // 4 Sales Reports
    expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
    expect(screen.getByText('Weekly Sales Report')).toBeInTheDocument();
    expect(screen.getByText('Monthly Sales Report')).toBeInTheDocument();
    expect(screen.getByText('Yearly Sales Report')).toBeInTheDocument();

    // 3 Inventory Reports
    expect(screen.getByText('Current Stock Report')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Report')).toBeInTheDocument();
    expect(screen.getByText('Out-of-Stock Products')).toBeInTheDocument();

    // 4 Purchase Reports
    expect(screen.getByText('Purchase by Supplier')).toBeInTheDocument();
    expect(screen.getByText('Purchase by Product')).toBeInTheDocument();
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
    expect(screen.getByText('Supplier Payment Report')).toBeInTheDocument();
  });

  it('navigates to detailed report view upon clicking a report card, displaying KPIs and table', async () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>
    );

    // Click on Daily Sales Report
    fireEvent.click(screen.getByText('Daily Sales Report'));

    // Should display report title and Back button
    await waitFor(() => {
      expect(screen.getByText('Back to Reports')).toBeInTheDocument();
      expect(screen.getByText('Total Sales Amount')).toBeInTheDocument();
      expect(screen.getByText('INV-2026-1042')).toBeInTheDocument();
    });

    // Back to dashboard
    fireEvent.click(screen.getByText('Back to Reports'));

    await waitFor(() => {
      expect(screen.getByText('Sales Reports')).toBeInTheDocument();
      expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
    });
  });
});

