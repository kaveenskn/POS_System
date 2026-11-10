import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { WholesalePage } from './WholesalePage';

vi.mock('../../services/wholesaleService', () => ({
  wholesaleService: {
    getStats: vi.fn().mockResolvedValue({
      client_count: 1,
      total_orders: 1,
      total_revenue: 14500,
      avg_order_value: 14500,
    }),
    getClients: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'Sunil Jayawardena',
          phone: '0771234567',
          email: 'sunil@motors.lk',
          company_name: 'Sunil Motors & Workshop',
          address: 'Kadawatha',
          created_at: new Date().toISOString(),
          total_orders: 1,
          total_spent: 14500,
        },
      ],
      total: 1,
    }),
    getOrders: vi.fn().mockResolvedValue({
      items: [
        {
          id: 101,
          invoice_number: 'WHL-20261110-0001',
          customer_id: 1,
          customer_name: 'Sunil Jayawardena',
          subtotal: 15000,
          discount_amount: 500,
          total_amount: 14500,
          payment_method: 'bank_transfer',
          amount_paid: 14500,
          change_amount: 0,
          status: 'completed',
          notes: 'Wholesale order',
          created_at: new Date().toISOString(),
          items: [
            {
              id: 1,
              product_id: 1,
              product_name: 'Motul 7100 4T 10W-40',
              product_code: 'OIL-MOT-7100',
              unit_price: 2900,
              cost_price: 2200,
              quantity: 5,
              line_total: 14500,
            },
          ],
        },
      ],
      total: 1,
    }),
    createClient: vi.fn(),
    createOrder: vi.fn(),
  },
}));

vi.mock('../../services/invoiceService', () => ({
  invoiceService: {
    getCustomers: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
    }),
    getInvoices: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
    }),
    searchProducts: vi.fn().mockResolvedValue({ items: [] }),
    createInvoice: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

describe('WholesalePage & B2B Distribution', () => {
  it('renders wholesale hub title, KPI metrics, and tab switchers', async () => {
    render(
      <BrowserRouter>
        <WholesalePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Wholesale & B2B Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Wholesale Accounts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Wholesale Invoices/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Wholesale Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Wholesale Clients Directory/i)).toBeInTheDocument();
    expect(screen.getAllByText(/New Wholesale Order/i).length).toBeGreaterThan(0);
  });
});
