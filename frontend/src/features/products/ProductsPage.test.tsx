import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProductsPage } from './ProductsPage';
import { productService } from '../../services/productService';
import { encodeCode128, generateCode128Svg } from '../../utils/barcodeGenerator';

describe('ProductsPage & Barcode Engine', () => {
  it('correctly generates standard Code-128 barcode symbols and SVG markup', () => {
    const text = 'BRM-BP-001';
    const symbols = encodeCode128(text);
    expect(symbols.length).toBeGreaterThan(text.length);
    expect(symbols[0]).toBe(104); // Start B
    expect(symbols[symbols.length - 1]).toBe(106); // Stop

    const svg = generateCode128Svg(text, { showText: true });
    expect(svg).toContain('<svg');
    expect(svg).toContain('rect');
    expect(svg).toContain(text);
  });

  it('renders products page with statistics cards, filters, and action buttons', async () => {
    vi.spyOn(productService, 'getProducts').mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'Brembo Sintered Front Brake Pads',
          code: 'BRM-BP-001',
          barcode: '200109283741',
          barcode_type: 'CODE128',
          category: 'Braking System',
          brand: 'Brembo',
          product_type: 'standard',
          status: 'active',
          cost_price: 1850,
          selling_price: 2650,
          default_discount: 0,
          tax_rate: 0,
          quantity: 18,
          opening_stock: 25,
          unit: 'Pairs',
          min_stock_level: 5,
          reorder_level: 10,
          stock_tracking_enabled: true,
          preferred_supplier: false,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
    });
    vi.spyOn(productService, 'getStatistics').mockResolvedValue({
      total_products: 1,
      active_products: 1,
      low_stock_products: 0,
      out_of_stock_products: 0,
      total_inventory_value: 33300,
      categories_count: 1,
    });
    vi.spyOn(productService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Braking System' }]);
    vi.spyOn(productService, 'getBrands').mockResolvedValue([{ id: 1, name: 'Brembo' }]);

    render(
      <BrowserRouter>
        <ProductsPage />
      </BrowserRouter>
    );

    // Title and actions
    expect(screen.getByText('Product Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add New Product/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /POS Scan Register/i })).toBeInTheDocument();

    // Stats cards
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('Active Products')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Products')).toBeInTheDocument();
    expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();

    // Wait for table items to be populated
    await waitFor(() => {
      expect(screen.getByText(/Brembo Sintered Front Brake Pads/i)).toBeInTheDocument();
    });
  });
});
