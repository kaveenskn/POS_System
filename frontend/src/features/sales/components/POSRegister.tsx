import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type {
  CartItem,
  Customer,
  CustomerCreateInput,
  DiscountType,
  InvoiceResponse,
  PaymentMethod,
} from '../../../types/invoice.types';
import type { Product } from '../../../types/product.types';
import { invoiceService } from '../../../services/invoiceService';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { InvoiceReceipt } from './InvoiceReceipt';

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 });

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'card', label: '💳 Card' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
];

type ScanState = 'idle' | 'scanning' | 'found' | 'not_found';

const calcItemDiscount = (
  unitPrice: number,
  qty: number,
  type: DiscountType,
  val: number
): number => {
  const gross = unitPrice * qty;
  if (!val || val <= 0 || isNaN(val)) return 0;
  if (type === 'percentage') {
    const clampedPct = Math.min(100, Math.max(0, val));
    return Math.round(((gross * clampedPct) / 100) * 100) / 100;
  }
  return Math.min(gross, Math.max(0, val));
};

export const POSRegister: FC = () => {
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscountType, setBillDiscountType] = useState<DiscountType>('fixed');
  const [billDiscountValue, setBillDiscountValue] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceResponse | null>(null);

  // Wholesale Customer selector
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState<CustomerCreateInput>({
    name: '',
    phone: '',
    company_name: '',
    address: '',
  });
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Barcode scanner state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScannedProduct, setLastScannedProduct] = useState<string>('');
  const scanFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Computed totals
  const grossSubtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const totalProductDiscounts = cart.reduce((s, i) => s + i.discount_amount, 0);
  const netAfterProductDiscounts = Math.max(0, grossSubtotal - totalProductDiscounts);

  const parsedBillDiscountVal = Math.max(0, parseFloat(billDiscountValue) || 0);
  const billDiscountAmount =
    billDiscountType === 'percentage'
      ? Math.round(((netAfterProductDiscounts * Math.min(100, parsedBillDiscountVal)) / 100) * 100) / 100
      : Math.min(netAfterProductDiscounts, parsedBillDiscountVal);

  const totalDiscount = totalProductDiscounts + billDiscountAmount;
  const finalTotal = Math.max(0, netAfterProductDiscounts - billDiscountAmount);
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - finalTotal);
  const remainingBalance = Math.max(0, finalTotal - paid);

  // ─── addToCart (shared by search-select and scanner) ────────────────────────
  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      setError(`Cannot add "${product.name}": Out of stock (0 available).`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= existing.available_stock) {
          setError(
            `Cannot add more "${product.name}": Available stock limit (${existing.available_stock}) reached.`
          );
          return prev;
        }
        const newQty = existing.quantity + 1;
        const newDisc = calcItemDiscount(
          existing.unit_price,
          newQty,
          existing.discount_type,
          existing.discount_value
        );
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: newQty,
                discount_amount: newDisc,
                line_total: Math.max(0, existing.unit_price * newQty - newDisc),
              }
            : i
        );
      }
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
          discount_type: 'percentage',
          discount_value: 0,
          discount_amount: 0,
          line_total: Number(product.selling_price),
        },
      ];
    });

    // Play standard POS scanner confirmation beep
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext not supported or user has not interacted
    }

    setProductSearch('');
    setShowDropdown(false);
    searchRef.current?.focus();
  }, []);

  // ─── Barcode scanner handler ────────────────────────────────────────────────
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      const cleanCode = barcode.trim();
      if (!cleanCode) return;

      setLastScannedCode(cleanCode);
      setScanState('scanning');
      if (scanFeedbackTimer.current) clearTimeout(scanFeedbackTimer.current);

      try {
        const product = await invoiceService.findByBarcode(cleanCode);

        if (product) {
          if (product.quantity <= 0) {
            setScanState('not_found');
            setError(`Cannot add "${product.name}": Product is out of stock (0 available).`);
          } else {
            setScanState('found');
            setLastScannedProduct(product.name);
            setError(null);
            addToCart(product);
          }
        } else {
          // If not found by exact barcode, try text search for part code / name
          const searchRes = await invoiceService.searchProducts(cleanCode);
          if (searchRes.items && searchRes.items.length > 0) {
            const topMatch = searchRes.items[0];
            if (topMatch.quantity <= 0) {
              setScanState('not_found');
              setError(`Cannot add "${topMatch.name}": Product is out of stock.`);
            } else {
              setScanState('found');
              setLastScannedProduct(topMatch.name);
              setError(null);
              addToCart(topMatch);
            }
          } else {
            setScanState('not_found');
            setLastScannedProduct('');
            setError(`Barcode "${cleanCode}" not found in inventory.`);
          }
        }
      } catch {
        setScanState('not_found');
        setError(`Failed to scan barcode "${cleanCode}". Please try again.`);
      }

      // Reset scan feedback after 2.5 s
      scanFeedbackTimer.current = setTimeout(() => {
        setScanState('idle');
        setLastScannedCode('');
        setLastScannedProduct('');
      }, 2500);
    },
    [addToCart]
  );

  // ─── Hook into the global barcode scanner ───────────────────────────────────
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    maxCharIntervalMs: 60,
    minLength: 4,
    consume: true,
  });

  // ─── Keyboard shortcut: pressing Enter on search triggers barcode lookup ────
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const query = productSearch.trim();
        if (query.length >= 2) {
          e.preventDefault();
          handleBarcodeScan(query);
        }
      }
    },
    [handleBarcodeScan, productSearch]
  );

  const handleAddTypedProduct = useCallback(async () => {
    const query = productSearch.trim();
    if (!query) {
      setError('Enter a product name, code, or barcode first.');
      searchRef.current?.focus();
      return;
    }

    setError(null);
    try {
      const exactProduct = await invoiceService.findByBarcode(query);
      if (exactProduct) {
        addToCart(exactProduct);
        return;
      }

      const results = await invoiceService.searchProducts(query);
      if (results.items.length === 1) {
        addToCart(results.items[0]);
        return;
      }

      if (results.items.length > 1) {
        setSearchResults(results.items);
        setShowDropdown(true);
        setError('Select a product from the matching results.');
        return;
      }

      setError(`No product found for "${query}".`);
    } catch {
      setError(`Unable to find a product for "${query}". Please try again.`);
    }
  }, [addToCart, productSearch]);

  // ─── Product text search with debounce ──────────────────────────────────────
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

  // Customer suggestions debounce
  useEffect(() => {
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current);
    customerSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await invoiceService.getCustomers(customerSearch.trim() || undefined);
        setCustomerSuggestions(res.items || []);
      } catch {
        setCustomerSuggestions([]);
      }
    }, 200);
  }, [customerSearch]);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddForm.name.trim() || !quickAddForm.phone?.trim()) {
      setError('Wholesale customer contact name and phone number are required.');
      return;
    }
    setIsQuickAdding(true);
    try {
      const created = await invoiceService.createCustomer({
        name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim(),
        company_name: quickAddForm.company_name?.trim() || undefined,
        address: quickAddForm.address?.trim() || undefined,
      });
      setSelectedCustomer(created);
      setCustomerSearch(created.name);
      setIsQuickAddModalOpen(false);
      setQuickAddForm({ name: '', phone: '', company_name: '', address: '' });
      setShowCustomerDropdown(false);
      setError(null);
    } catch {
      setError('Failed to create wholesale customer.');
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      if (scanFeedbackTimer.current) clearTimeout(scanFeedbackTimer.current);
      if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current);
    },
    []
  );

  // ─── Cart helpers ────────────────────────────────────────────────────────────
  const updateQty = (productId: number, qty: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const clamped = Math.max(1, Math.min(qty, i.available_stock));
        const disc = calcItemDiscount(i.unit_price, clamped, i.discount_type, i.discount_value);
        return {
          ...i,
          quantity: clamped,
          discount_amount: disc,
          line_total: Math.max(0, i.unit_price * clamped - disc),
        };
      })
    );
  };

  const updateItemDiscountType = (productId: number, type: DiscountType) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const disc = calcItemDiscount(i.unit_price, i.quantity, type, i.discount_value);
        return {
          ...i,
          discount_type: type,
          discount_amount: disc,
          line_total: Math.max(0, i.unit_price * i.quantity - disc),
        };
      })
    );
  };

  const updateItemDiscountValue = (productId: number, val: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const safeVal = Math.max(0, isNaN(val) ? 0 : val);
        const disc = calcItemDiscount(i.unit_price, i.quantity, i.discount_type, safeVal);
        return {
          ...i,
          discount_value: safeVal,
          discount_amount: disc,
          line_total: Math.max(0, i.unit_price * i.quantity - disc),
        };
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscountValue('0');
    setBillDiscountType('fixed');
    setAmountPaid('');
    setNotes('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setError(null);
  };

  // ─── Complete Sale ───────────────────────────────────────────────────────────
  const handleCompleteSale = async () => {
    setError(null);
    if (cart.length === 0) {
      setError('Add at least one product to the cart.');
      return;
    }
    if (paid < finalTotal) {
      setError(
        `Amount received (${fmt(paid)}) is less than total payable (${fmt(finalTotal)}). Short by ${fmt(finalTotal - paid)}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const invoice = await invoiceService.createInvoice({
        customer_id: selectedCustomer?.id,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount,
        })),
        discount_amount: billDiscountAmount,
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

  // ─── Scan status banner ──────────────────────────────────────────────────────
  const ScanBanner = () => {
    if (scanState === 'idle') return null;
    const configs = {
      scanning: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        icon: (
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
        ),
        message: `Scanning barcode: ${lastScannedCode}`,
      },
      found: {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: <span className="text-base">✓</span>,
        message: `Added: ${lastScannedProduct}`,
      },
      not_found: {
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-400',
        icon: <span className="text-base">⚠</span>,
        message: `No product found for barcode: ${lastScannedCode}`,
      },
    };
    const cfg = configs[scanState];
    return (
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${cfg.bg} ${cfg.text}`}
      >
        {cfg.icon}
        <span>{cfg.message}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      {/* LEFT: Cart */}
      <div className="xl:col-span-3 space-y-4">

        {/* ── Scan feedback banner ───────────────────────────────────────── */}
        <ScanBanner />

        {/* ── Product Search + Barcode hint ─────────────────────────────── */}
        <div className="relative">
          {/* Input row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={searchRef}
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="🔍  Search by name, code, or scan barcode…"
                className="w-full bg-[#14161d] border border-zinc-700 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826] focus:ring-1 focus:ring-[#eb4826]"
                autoFocus
              />
              {/* Scan icon badge */}
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-lg select-none pointer-events-none"
                title="USB barcode scanner auto-detected"
              >
                〽
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddTypedProduct}
              className="flex-shrink-0 rounded-xl bg-[#eb4826] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ff5534]"
            >
              Add
            </button>

            {/* Barcode scan indicator dot */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                scanState === 'found'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : scanState === 'scanning'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : scanState === 'not_found'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-600'
              }`}
              title={
                scanState === 'idle'
                  ? 'Waiting for barcode scan…'
                  : scanState === 'scanning'
                  ? 'Processing scan…'
                  : scanState === 'found'
                  ? 'Product found!'
                  : 'Product not found'
              }
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h2M3 15v4a2 2 0 002 2h2M15 3h4a2 2 0 012 2v2M15 21h4a2 2 0 002-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1" strokeWidth={1.5} />
                <line x1="9" y1="9" x2="9" y2="15" strokeWidth={2.5} />
                <line x1="12" y1="9" x2="12" y2="15" strokeWidth={1.5} />
                <line x1="15" y1="9" x2="15" y2="15" strokeWidth={2.5} />
              </svg>
            </div>
          </div>

          {/* Search dropdown */}
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
                    {p.barcode && (
                      <div className="text-xs font-mono text-zinc-600 mt-0.5">
                        📦 {p.barcode}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
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

        {/* ── Barcode scanner tip ────────────────────────────────────────── */}
        <p className="text-xs text-zinc-600 -mt-1 ml-1">
          💡 Connect a USB barcode scanner — it auto-adds items to the cart without clicking.
          Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-400">Enter</kbd> to add the first search result.
        </p>

        {/* ── Cart Table ────────────────────────────────────────────────── */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-zinc-300">
              <thead className="bg-[#181a22] border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Discount</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h2M3 15v4a2 2 0 002 2h2M15 3h4a2 2 0 012 2v2M15 21h4a2 2 0 002-2v-2" />
                          <rect x="7" y="7" width="10" height="10" rx="1" strokeWidth={1.5} />
                        </svg>
                        <span>Scan a barcode or search for products above</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr
                      key={item.product_id}
                      className={`hover:bg-zinc-800/20 transition-colors ${
                        lastScannedProduct === item.product_name && scanState === 'found'
                          ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.product_name}</div>
                        <div className="text-xs font-mono text-[#eb4826]">{item.product_code}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="text-zinc-300">{fmt(item.unit_price)}</div>
                        {item.discount_amount > 0 && (
                          <div className="text-[11px] text-emerald-400 font-sans">
                            Net: {fmt(item.line_total / item.quantity)}
                          </div>
                        )}
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
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center bg-[#0b0c10] border border-zinc-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateItemDiscountType(item.product_id, 'percentage')}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                                item.discount_type === 'percentage'
                                  ? 'bg-[#eb4826] text-white shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                              title="Percentage Discount (%)"
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemDiscountType(item.product_id, 'fixed')}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                                item.discount_type === 'fixed'
                                  ? 'bg-[#eb4826] text-white shadow'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                              title="Fixed Discount (Rs.)"
                            >
                              Rs
                            </button>
                            <input
                              type="number"
                              data-testid="item-discount-input"
                              aria-label="Item discount value"
                              min="0"
                              max={item.discount_type === 'percentage' ? 100 : item.unit_price * item.quantity}
                              step={item.discount_type === 'percentage' ? '1' : '10'}
                              value={item.discount_value === 0 ? '' : item.discount_value}
                              placeholder="0"
                              onChange={(e) =>
                                updateItemDiscountValue(item.product_id, parseFloat(e.target.value) || 0)
                              }
                              className="w-14 text-right bg-transparent text-xs text-amber-400 font-mono focus:outline-none pr-1"
                            />
                          </div>
                          {item.discount_amount > 0 && (
                            <span data-testid="item-discount-badge" className="text-[10px] text-emerald-400 font-medium">
                              -{fmt(item.discount_amount)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {item.discount_amount > 0 && (
                          <div className="text-[10px] line-through text-zinc-500 font-mono">
                            {fmt(item.unit_price * item.quantity)}
                          </div>
                        )}
                        <span data-testid="item-line-total" className="text-emerald-400 font-mono">
                          {fmt(item.line_total)}
                        </span>
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

          {/* Wholesale Customer Selection */}
          <div className="border-b border-zinc-800/80 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-400">
                Customer / Wholesale Account
              </label>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(true)}
                className="text-[11px] text-[#eb4826] hover:text-[#ff5534] font-semibold"
              >
                + Quick Add Wholesale
              </button>
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400">🏢</span>
                    <span>{selectedCustomer.name}</span>
                    {selectedCustomer.company_name && (
                      <span className="text-[11px] font-normal text-amber-400">
                        ({selectedCustomer.company_name})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    📞 {selectedCustomer.phone || 'No phone'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition"
                  title="Switch to Walk-in customer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Select or search Wholesale Customer..."
                  className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
                />

                {showCustomerDropdown && (
                  <div className="absolute z-40 left-0 right-0 mt-1 bg-[#1a1c24] border border-zinc-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onMouseDown={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-zinc-800 text-zinc-400 hover:text-white border-b border-zinc-800 flex items-center justify-between"
                    >
                      <span>🚶 Walk-in Retail Customer</span>
                      <span className="text-[10px] text-zinc-500">Default</span>
                    </button>

                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch(c.name);
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-800 border-b border-zinc-800/40 text-xs transition"
                      >
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="text-emerald-400">🏢</span>
                          <span>{c.name}</span>
                          {c.company_name && (
                            <span className="text-[11px] text-amber-400 font-normal">[{c.company_name}]</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>📞 {c.phone}</span>
                          {c.address && <span>• {c.address}</span>}
                        </div>
                      </button>
                    ))}

                    {customerSuggestions.length === 0 && customerSearch.trim() && (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No wholesale customer found.
                        <button
                          type="button"
                          onMouseDown={() => {
                            setShowCustomerDropdown(false);
                            setQuickAddForm((p) => ({ ...p, name: customerSearch.trim() }));
                            setIsQuickAddModalOpen(true);
                          }}
                          className="block mx-auto mt-1 text-[#eb4826] font-semibold hover:underline"
                        >
                          + Register "{customerSearch}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span data-testid="gross-subtotal" className="font-mono text-white">{fmt(grossSubtotal)}</span>
            </div>

            {totalProductDiscounts > 0 && (
              <div className="flex justify-between text-emerald-400 text-xs">
                <span>Product Discounts</span>
                <span data-testid="product-discounts-total" className="font-mono font-medium">- {fmt(totalProductDiscounts)}</span>
              </div>
            )}

            {/* Overall Bill Discount */}
            <div className="p-3 bg-[#0f1117] border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Bill Discount</span>
                <div className="flex items-center bg-[#07080a] border border-zinc-700 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setBillDiscountType('fixed')}
                    className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                      billDiscountType === 'fixed'
                        ? 'bg-[#eb4826] text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Rs
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillDiscountType('percentage')}
                    className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                      billDiscountType === 'percentage'
                        ? 'bg-[#eb4826] text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    %
                  </button>
                  <input
                    type="number"
                    data-testid="bill-discount-input"
                    aria-label="Overall bill discount value"
                    min="0"
                    max={billDiscountType === 'percentage' ? 100 : netAfterProductDiscounts}
                    step={billDiscountType === 'percentage' ? '1' : '50'}
                    value={billDiscountValue === '0' ? '' : billDiscountValue}
                    placeholder="0"
                    onChange={(e) => setBillDiscountValue(e.target.value)}
                    className="w-20 text-right bg-transparent text-xs text-amber-400 font-mono focus:outline-none pr-1.5"
                  />
                </div>
              </div>
              {billDiscountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 pt-1 border-t border-zinc-800/60">
                  <span>Bill Discount Applied ({billDiscountType === 'percentage' ? `${billDiscountValue}%` : 'Fixed'})</span>
                  <span data-testid="bill-discount-amount" className="font-mono font-medium">- {fmt(billDiscountAmount)}</span>
                </div>
              )}
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs font-semibold text-emerald-400 px-1">
                <span>Total Discounts (Product + Bill)</span>
                <span data-testid="total-discounts" className="font-mono">- {fmt(totalDiscount)}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="flex justify-between font-black text-xl text-white border-t border-zinc-700/80 pt-3">
              <span>Final Total</span>
              <span data-testid="final-total" className="text-[#eb4826] font-mono">{fmt(finalTotal)}</span>
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="amount-paid" className="text-xs font-semibold text-zinc-400">
                Amount Received (Rs.)
              </label>
              {paid > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountPaid('')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              id="amount-paid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={finalTotal > 0 ? finalTotal.toFixed(2) : '0.00'}
              className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#eb4826]"
            />
            {/* Quick fill buttons */}
            {finalTotal > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAmountPaid(finalTotal.toFixed(2))}
                  className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-[#eb4826] text-zinc-200 hover:text-white font-semibold transition"
                >
                  Exact ({fmt(finalTotal)})
                </button>
                {[
                  Math.ceil(finalTotal / 100) * 100,
                  Math.ceil(finalTotal / 500) * 500,
                  Math.ceil(finalTotal / 1000) * 1000,
                  Math.ceil(finalTotal / 5000) * 5000,
                ]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx && v > finalTotal)
                  .slice(0, 3)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmountPaid(v.toFixed(2))}
                      className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                    >
                      {fmt(v)}
                    </button>
                  ))}
                {/* Note addition buttons */}
                {[100, 500, 1000, 5000].map((addAmt) => (
                  <button
                    key={`add-${addAmt}`}
                    type="button"
                    onClick={() => setAmountPaid(((parseFloat(amountPaid) || 0) + addAmt).toFixed(2))}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                  >
                    +{addAmt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Balance / Change */}
          {paid > 0 && (
            <div
              data-testid="payment-balance-banner"
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                paid >= finalTotal
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">
                  {paid >= finalTotal ? '✓' : '⚠'}
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {paid >= finalTotal ? 'Balance / Change to Return' : 'Remaining Balance / Short Amount'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {paid >= finalTotal
                      ? 'Hand back to customer'
                      : 'Additional payment required'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  data-testid={paid >= finalTotal ? 'change-amount' : 'remaining-balance'}
                  className="font-mono text-lg font-black"
                >
                  {paid >= finalTotal ? fmt(change) : fmt(remainingBalance)}
                </span>
              </div>
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
                Processing…
              </span>
            ) : (
              `✓  Complete Sale  •  ${fmt(finalTotal)}`
            )}
          </button>
        </div>

        {/* Scanner status panel */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h2M3 15v4a2 2 0 002 2h2M15 3h4a2 2 0 012 2v2M15 21h4a2 2 0 002-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Barcode Scanner</span>
            <span
              className={`ml-auto w-2 h-2 rounded-full ${
                scanState === 'found'
                  ? 'bg-emerald-400 animate-pulse'
                  : scanState === 'scanning'
                  ? 'bg-blue-400 animate-ping'
                  : scanState === 'not_found'
                  ? 'bg-amber-400'
                  : 'bg-zinc-600'
              }`}
            />
          </div>
          <div className="text-xs text-zinc-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
              USB scanner auto-detected globally
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500/50" />
              Works even when other fields are focused
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              Scan same item again to increase qty
            </div>
          </div>
          {lastScannedCode && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-xs font-mono">
              <span className="text-zinc-600">Last scan: </span>
              <span className={`${scanState === 'found' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {lastScannedCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Quick Add Wholesale Customer ──────────────────────────────── */}
      {isQuickAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#17181c] border border-zinc-700 rounded-2xl shadow-2xl p-5 text-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h4 className="text-sm font-bold">Quick Add Wholesale Customer</h4>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Contact Person / Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sunil Jayawardena"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Company / Workshop Name
                </label>
                <input
                  type="text"
                  value={quickAddForm.company_name ?? ''}
                  onChange={(e) => setQuickAddForm((p) => ({ ...p, company_name: e.target.value }))}
                  placeholder="e.g. Sunil Motors"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={quickAddForm.phone ?? ''}
                  onChange={(e) => setQuickAddForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 0771234567"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  value={quickAddForm.address ?? ''}
                  onChange={(e) => setQuickAddForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. Kadawatha"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQuickAdding}
                  className="px-3 py-1.5 rounded-lg bg-[#eb4826] hover:bg-[#ff5733] text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isQuickAdding ? 'Adding…' : 'Add & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
