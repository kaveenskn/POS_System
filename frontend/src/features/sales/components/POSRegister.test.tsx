import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POSRegister } from './POSRegister';
import { invoiceService } from '../../../services/invoiceService';

import type { Product } from '../../../types/product.types';

vi.mock('../../../services/invoiceService', () => ({
  invoiceService: {
    searchProducts: vi.fn(),
    findByBarcode: vi.fn(),
    getCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createCustomer: vi.fn(),
    createInvoice: vi.fn(),
  },
}));

describe('POS Register & Checkout Billing Engine', () => {
  const mockProduct1: Product = {
    id: 1,
    name: 'Yamaha FZ Front Brake Pad',
    code: 'BP-YAM-FZ',
    barcode: '4790011223344',
    barcode_type: 'CODE128',
    brand: 'Yamaha',
    category: 'Brakes',
    cost_price: 1200,
    selling_price: 2500,
    quantity: 15,
    min_stock_level: 3,
    status: 'IN_STOCK',
    product_type: 'spare_part',
    default_discount: 0,
    tax_rate: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Product;

  const mockProduct2: Product = {
    id: 2,
    name: 'Motul 7100 4T 10W-40 1L',
    code: 'OIL-MOT-7100',
    barcode: '4790055667788',
    barcode_type: 'CODE128',
    brand: 'Motul',
    category: 'Engine Oil',
    cost_price: 3200,
    selling_price: 4500,
    quantity: 5,
    min_stock_level: 2,
    status: 'IN_STOCK',
    product_type: 'spare_part',
    default_discount: 0,
    tax_rate: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Product;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders POS register interface with scan input and empty cart message', () => {
    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/search by name, code, or scan barcode/i)).toBeInTheDocument();
    expect(screen.getByText(/scan a barcode or search for products above/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^payment$/i })).toBeInTheDocument();
  });

  it('adds scanned product to cart and increments quantity on duplicate scan', async () => {
    vi.mocked(invoiceService.findByBarcode).mockResolvedValue(mockProduct1);

    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by name, code, or scan barcode/i);

    // 1st scan
    fireEvent.change(searchInput, { target: { value: '4790011223344' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Yamaha FZ Front Brake Pad')).toBeInTheDocument();
    });

    const qtyInput = screen.getByDisplayValue('1');
    expect(qtyInput).toBeInTheDocument();
    expect(screen.getByTestId('item-line-total')).toHaveTextContent('Rs. 2,500.00');

    // 2nd scan of same item increments quantity
    fireEvent.change(searchInput, { target: { value: '4790011223344' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('item-line-total')).toHaveTextContent('Rs. 5,000.00');
  });

  it('allows manual edit of quantity with stock limits', async () => {
    vi.mocked(invoiceService.findByBarcode).mockResolvedValue(mockProduct1);

    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by name, code, or scan barcode/i);
    fireEvent.change(searchInput, { target: { value: '4790011223344' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Yamaha FZ Front Brake Pad')).toBeInTheDocument();
    });

    // Increase qty using '+' button
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();

    // Decrease qty using '-' button
    const minusBtn = screen.getByText('−');
    fireEvent.click(minusBtn);
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();

    // Direct input edit
    const qtyInput = screen.getByDisplayValue('1');
    fireEvent.change(qtyInput, { target: { value: '4' } });
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByTestId('item-line-total')).toHaveTextContent('Rs. 10,000.00');
  });

  it('calculates product-level discounts (% and fixed amount)', async () => {
    vi.mocked(invoiceService.findByBarcode).mockResolvedValue(mockProduct1);

    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by name, code, or scan barcode/i);
    fireEvent.change(searchInput, { target: { value: '4790011223344' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Yamaha FZ Front Brake Pad')).toBeInTheDocument();
    });

    // 1 item = Rs. 2,500. Apply 10% discount: 2500 * 10% = 250 discount, line total = 2250
    const itemDiscountInput = screen.getByTestId('item-discount-input');
    fireEvent.change(itemDiscountInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByTestId('item-discount-badge')).toHaveTextContent('-Rs. 250.00');
      expect(screen.getByTestId('item-line-total')).toHaveTextContent('Rs. 2,250.00');
    });

    // Switch to fixed Rs discount: e.g. Rs. 500 fixed
    const fixedTypeButtons = screen.getAllByRole('button', { name: /rs/i });
    fireEvent.click(fixedTypeButtons[0]); // cart row fixed button
    fireEvent.change(itemDiscountInput, { target: { value: '500' } });

    await waitFor(() => {
      expect(screen.getByTestId('item-discount-badge')).toHaveTextContent('-Rs. 500.00');
      expect(screen.getByTestId('item-line-total')).toHaveTextContent('Rs. 2,000.00');
    });
  });

  it('calculates overall bill discount after product-level discounts and computes change correctly', async () => {
    vi.mocked(invoiceService.findByBarcode).mockResolvedValue(mockProduct1);

    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by name, code, or scan barcode/i);
    fireEvent.change(searchInput, { target: { value: '4790011223344' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Yamaha FZ Front Brake Pad')).toBeInTheDocument();
    });

    // Item: Rs. 2,500. Set item discount to Rs. 500 fixed.
    // Subtotal after item discount = Rs. 2,000.
    const fixedTypeButtons = screen.getAllByRole('button', { name: /rs/i });
    fireEvent.click(fixedTypeButtons[0]); // item level
    const itemDiscountInput = screen.getByTestId('item-discount-input');
    fireEvent.change(itemDiscountInput, { target: { value: '500' } });

    // Now apply bill discount of Rs. 200 in the checkout summary
    const billDiscountInput = screen.getByTestId('bill-discount-input');
    fireEvent.change(billDiscountInput, { target: { value: '200' } });

    // Final total should be 2000 - 200 = 1800
    await waitFor(() => {
      expect(screen.getByTestId('final-total')).toHaveTextContent('Rs. 1,800.00');
    });

    // Enter Amount Received = 2000
    const amountPaidInput = screen.getByPlaceholderText('1800.00');
    fireEvent.change(amountPaidInput, { target: { value: '2000' } });

    // Change should be 200.00
    await waitFor(() => {
      expect(screen.getByText(/balance \/ change to return/i)).toBeInTheDocument();
      expect(screen.getByTestId('change-amount')).toHaveTextContent('Rs. 200.00');
    });

    // If Amount Received = 1500 (less than 1800), shows Remaining Balance / Short Amount of 300
    fireEvent.change(amountPaidInput, { target: { value: '1500' } });
    await waitFor(() => {
      expect(screen.getByText(/remaining balance \/ short amount/i)).toBeInTheDocument();
      expect(screen.getByTestId('remaining-balance')).toHaveTextContent('Rs. 300.00');
    });
  });

  it('completes the sale and invokes invoiceService with accurate calculation details', async () => {
    vi.mocked(invoiceService.findByBarcode).mockResolvedValue(mockProduct2);
    vi.mocked(invoiceService.createInvoice).mockResolvedValue({
      id: 99,
      invoice_number: 'INV-20261110-0099',
      customer_id: null,
      customer_name: null,
      subtotal: 4500,
      discount_amount: 500,
      total_amount: 4000,
      payment_method: 'cash',
      amount_paid: 5000,
      change_amount: 1000,
      status: 'completed',
      notes: null,
      created_at: new Date().toISOString(),
      items: [
        {
          id: 1,
          product_id: 2,
          product_name: 'Motul 7100 4T 10W-40 1L',
          product_code: 'OIL-MOT-7100',
          unit_price: 4500,
          cost_price: 3200,
          quantity: 1,
          line_total: 4000,
          discount_amount: 500,
        },
      ],
    });

    render(
      <BrowserRouter>
        <POSRegister />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search by name, code, or scan barcode/i);
    fireEvent.change(searchInput, { target: { value: '4790055667788' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Motul 7100 4T 10W-40 1L')).toBeInTheDocument();
    });

    // Apply Rs. 500 item discount
    const fixedButtons = screen.getAllByRole('button', { name: /rs/i });
    fireEvent.click(fixedButtons[0]);
    const itemDiscountInput = screen.getByTestId('item-discount-input');
    fireEvent.change(itemDiscountInput, { target: { value: '500' } });

    // Amount paid = 5000
    const amountPaidInput = screen.getByPlaceholderText('4000.00');
    fireEvent.change(amountPaidInput, { target: { value: '5000' } });

    // Click Complete Sale
    const completeBtn = screen.getByText(/complete sale/i);
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          amount_paid: 5000,
          payment_method: 'cash',
          items: [
            expect.objectContaining({
              product_id: 2,
              quantity: 1,
              discount_amount: 500,
            }),
          ],
        })
      );
    });

    // Check that invoice receipt modal opened
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /invoice receipt/i })).toBeInTheDocument();
      expect(screen.getByText('INV-20261110-0099')).toBeInTheDocument();
    });
  });
});
