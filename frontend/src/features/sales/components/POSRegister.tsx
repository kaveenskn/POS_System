import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type { CartItem, InvoiceResponse, PaymentMethod } from '../../../types/invoice.types';
import type { Product } from '../../../types/product.types';
import { invoiceService } from '../../../services/invoiceService';
import { InvoiceReceipt } from './InvoiceReceipt';

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 });

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'card', label: '💳 Card' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
];

export const POSRegister: FC = () => {
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceResponse | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Computed totals
  const subtotal = cart.reduce((s, i) => s + i.line_total, 0);
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountAmt);
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  // Product search with debounce
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await invoiceService.searchProducts(productSearch);
        setSearchResults(data.items ?? []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }, [productSearch]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= existing.available_stock) return prev; // stock guard
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, line_total: i.unit_price * (i.quantity + 1) }
            : i
        );
      }
      if (product.quantity <= 0) return prev;
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          unit_price: Number(product.selling_price),
          cost_price: Number(product.cost_price),
          available_stock: product.quantity,
          quantity: 1,
          line_total: Number(product.selling_price),
        },
      ];
    });
    setProductSearch('');
    setShowDropdown(false);
    searchRef.current?.focus();
  };

  const updateQty = (productId: number, qty: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const clamped = Math.max(1, Math.min(qty, i.available_stock));
        return { ...i, quantity: clamped, line_total: i.unit_price * clamped };
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setAmountPaid('');
    setNotes('');
    setError(null);
  };

  const handleCompleteSale = async () => {
    setError(null);
    if (cart.length === 0) { setError('Add at least one product to the cart.'); return; }
    if (paid < total) { setError(`Amount paid (${fmt(paid)}) is less than total (${fmt(total)}).`); return; }

    setIsSubmitting(true);
    try {
      const invoice = await invoiceService.createInvoice({
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_amount: discountAmt,
        payment_method: paymentMethod,
        amount_paid: paid,
        notes: notes.trim() || undefined,
      });
      setCompletedInvoice(invoice);
      clearCart();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Failed to complete sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      {/* LEFT: Cart */}
      <div className="xl:col-span-3 space-y-4">
        {/* Product Search */}
        <div className="relative">
          <input
            ref={searchRef}
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="🔍  Search product by name or code..."
            className="w-full bg-[#14161d] border border-zinc-700 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826] focus:ring-1 focus:ring-[#eb4826]"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-[#1a1c24] border border-zinc-700 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800 transition text-left"
                >
                  <div>
                    <div className="text-white text-sm font-medium">{p.name}</div>
                    <div className="text-xs font-mono text-[#eb4826]">{p.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-semibold text-sm">{fmt(Number(p.selling_price))}</div>
                    <div className={`text-xs ${p.quantity <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      Stock: {p.quantity}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchResults.length === 0 && productSearch.trim() && (
            <div className="absolute z-30 w-full mt-1 bg-[#1a1c24] border border-zinc-700 rounded-2xl shadow-xl px-5 py-4 text-sm text-zinc-500">
              No products found for "{productSearch}"
            </div>
          )}
        </div>

        {/* Cart Table */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-zinc-300">
              <thead className="bg-[#181a22] border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-600 text-sm">
                      Search for products above to add them to the sale
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.product_id} className="hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.product_name}</div>
                        <div className="text-xs font-mono text-[#eb4826]">{item.product_code}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        {fmt(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition"
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            max={item.available_stock}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                            className="w-14 text-center bg-[#0b0c10] border border-zinc-700 rounded-lg py-1 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.available_stock}
                            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
                          >+</button>
                        </div>
                        <div className="text-xs text-zinc-600 text-center mt-0.5">/{item.available_stock} stock</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {fmt(item.line_total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-zinc-600 hover:text-red-400 transition p-1"
                          title="Remove"
                        >✕</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-zinc-500 hover:text-red-400 transition"
          >
            🗑 Clear cart
          </button>
        )}
      </div>

      {/* RIGHT: Payment Panel */}
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white">Payment</h3>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Discount (Rs.)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-28 text-right bg-[#0b0c10] border border-zinc-700 rounded-lg px-2 py-1 text-sm text-amber-400 focus:outline-none focus:border-[#eb4826]"
              />
            </div>
            <div className="flex justify-between font-black text-xl text-white border-t border-zinc-700 pt-3">
              <span>TOTAL</span>
              <span className="text-[#eb4826]">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    paymentMethod === m.value
                      ? 'bg-[#eb4826] border-[#eb4826] text-white shadow-lg shadow-red-600/20'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label htmlFor="amount-paid" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Amount Received (Rs.)
            </label>
            <input
              id="amount-paid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={total.toFixed(2)}
              className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#eb4826]"
            />
            {/* Quick fill buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .slice(0, 4)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountPaid(v.toFixed(2))}
                    className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                  >
                    {fmt(v)}
                  </button>
                ))}
            </div>
          </div>

          {/* Change */}
          {paid > 0 && (
            <div className={`flex justify-between font-semibold rounded-xl px-4 py-3 ${
              paid >= total ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <span>{paid >= total ? 'Change' : 'Short by'}</span>
              <span>{paid >= total ? fmt(change) : fmt(total - paid)}</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="sale-notes" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Notes (Optional)
            </label>
            <input
              id="sale-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. warranty info, customer request..."
              className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Complete Sale */}
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-white font-black text-base shadow-lg shadow-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </span>
            ) : (
              `✓  Complete Sale  •  ${fmt(total)}`
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedInvoice && (
        <InvoiceReceipt
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};

