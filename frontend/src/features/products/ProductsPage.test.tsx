import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
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

