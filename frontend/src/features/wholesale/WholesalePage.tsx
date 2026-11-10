import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { invoiceService } from '../../services/invoiceService';
import {
  wholesaleService,
  type WholesaleClient,
  type WholesaleStats,
} from '../../services/wholesaleService';
import { InvoiceReceipt } from '../sales/components/InvoiceReceipt';
import type {
  CustomerCreateInput,
  InvoiceResponse,
  PaymentMethod,
} from '../../types/invoice.types';
import type { Product } from '../../types/product.types';

type WholesaleTab = 'clients' | 'order' | 'history';

interface WholesaleOrderItem {
  product: Product;
  quantity: number;
  unit_price: number;
  line_total: number;
}

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const WholesalePage: FC = () => {
  const [activeTab, setActiveTab] = useState<WholesaleTab>('clients');

  // ─── Data states ─────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<WholesaleClient[]>([]);
  const [orders, setOrders] = useState<InvoiceResponse[]>([]);
  const [stats, setStats] = useState<WholesaleStats>({
    client_count: 0,
    total_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
  });
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ─── Customer Modal State ───────────────────────────────────────────────────
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState<CustomerCreateInput>({
    name: '',
    phone: '',
    email: '',
    company_name: '',
    address: '',
  });

  // ─── Wholesale Order State ──────────────────────────────────────────────────
  const [orderCustomer, setOrderCustomer] = useState<WholesaleClient | null>(null);
  const [orderCustomerSearch, setOrderCustomerSearch] = useState('');
  const [showOrderCustomerDropdown, setShowOrderCustomerDropdown] = useState(false);

  const [productQuery, setProductQuery] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState<number>(10);
  const [addPrice, setAddPrice] = useState<string>('');

  const [orderItems, setOrderItems] = useState<WholesaleOrderItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [orderAmountPaid, setOrderAmountPaid] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceResponse | null>(null);

  const searchProductTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // ─── Load Backend Data ───────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const s = await wholesaleService.getStats();
      setStats(s);
    } catch {
      // handled
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await wholesaleService.getClients(customerSearch.trim() || undefined);
      setCustomers(res.items);
    } catch {
      showNotification('Unable to fetch wholesale customers from backend', 'error');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [customerSearch]);

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await wholesaleService.getOrders({ limit: 100 });
      setOrders(res.items);
    } catch {
      // offline fallback
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // ─── Metrics fallback / real-time ───────────────────────────────────────────
  const wholesaleMetrics = useMemo(() => {
    if (stats.total_orders > 0 || stats.client_count > 0) {
      return {
        clientCount: stats.client_count,
        totalOrders: stats.total_orders,
        totalRevenue: stats.total_revenue,
        avgOrder: stats.avg_order_value,
      };
    }
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return {
      clientCount: customers.length,
      totalOrders,
      totalRevenue,
      avgOrder,
    };
  }, [stats, orders, customers.length]);

  // ─── Customer Spent Summary ──────────────────────────────────────────────────
  const customerStatsMap = useMemo(() => {
    const map = new Map<number, { orderCount: number; totalSpent: number }>();
    customers.forEach((c) => {
      if (c.total_orders !== undefined || c.total_spent !== undefined) {
        map.set(c.id, {
          orderCount: c.total_orders || 0,
          totalSpent: c.total_spent || 0,
        });
      }
    });
    // Supplement from orders if available
    orders.forEach((inv) => {
      if (inv.customer_id && !map.has(inv.customer_id)) {
        const cur = map.get(inv.customer_id) || { orderCount: 0, totalSpent: 0 };
        cur.orderCount += 1;
        cur.totalSpent += Number(inv.total_amount);
        map.set(inv.customer_id, cur);
      }
    });
    return map;
  }, [customers, orders]);

  // ─── Product Search for Order ────────────────────────────────────────────────
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductSuggestions([]);
      setShowProductDropdown(false);
      return;
    }
    if (searchProductTimeout.current) clearTimeout(searchProductTimeout.current);
    searchProductTimeout.current = setTimeout(async () => {
      try {
        const res = await invoiceService.searchProducts(productQuery.trim());
        setProductSuggestions(res.items ?? []);
        setShowProductDropdown(true);
      } catch {
        setProductSuggestions([]);
      }
    }, 250);
  }, [productQuery]);

  // ─── Handle Select Product To Add ────────────────────────────────────────────
  const handleSelectProduct = (product: Product) => {
    setSelectedProductToAdd(product);
    setProductQuery(product.name);
    const price = product.wholesale_price ? String(product.wholesale_price) : String(product.selling_price);
    setAddPrice(price);
    setAddQty(Math.min(10, Math.max(1, product.quantity)));
    setShowProductDropdown(false);
  };

  const handleAddProductToOrder = () => {
    let product = selectedProductToAdd;
    if (!product && productQuery.trim()) {
      const match =
        productSuggestions.find(
          (p) =>
            p.name.toLowerCase() === productQuery.trim().toLowerCase() ||
            p.code.toLowerCase() === productQuery.trim().toLowerCase()
        ) || productSuggestions[0];
      if (match) {
        product = match;
        setSelectedProductToAdd(match);
      }
    }

    if (!product) {
      showNotification('Please select or search a valid product from the catalog.', 'error');
      return;
    }
    if (addQty <= 0) {
      showNotification('Wholesale quantity must be at least 1 unit.', 'error');
      return;
    }
    if (addQty > product.quantity) {
      showNotification(
        `Quantity (${addQty}) exceeds available warehouse stock (${product.quantity} units).`,
        'error'
      );
      return;
    }
    const unitPrice = parseFloat(addPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      showNotification('Please enter a valid wholesale unit price.', 'error');
      return;
    }

    const currentProduct = product;
    setOrderItems((prev) => {
      const idx = prev.findIndex((item) => item.product.id === currentProduct.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = Math.min(currentProduct.quantity, updated[idx].quantity + addQty);
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          unit_price: unitPrice,
          line_total: newQty * unitPrice,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product: currentProduct,
          quantity: addQty,
          unit_price: unitPrice,
          line_total: addQty * unitPrice,
        },
      ];
    });

    // Reset selection input
    setSelectedProductToAdd(null);
    setProductQuery('');
    setAddQty(10);
    setAddPrice('');
    showNotification(`Added ${addQty}x "${currentProduct.name}" to wholesale order.`);
  };

  const handleUpdateItemQty = (productId: number, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const clamped = Math.max(1, Math.min(qty, item.product.quantity));
        return {
          ...item,
          quantity: clamped,
          line_total: clamped * item.unit_price,
        };
      })
    );
  };

  const handleUpdateItemPrice = (productId: number, priceStr: string) => {
    const p = parseFloat(priceStr) || 0;
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        return {
          ...item,
          unit_price: p,
          line_total: item.quantity * p,
        };
      })
    );
  };

  const handleRemoveOrderItem = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // ─── Order Calculations ──────────────────────────────────────────────────────
  const orderSubtotal = orderItems.reduce((acc, item) => acc + item.line_total, 0);
  const orderDiscountAmt = Math.min(parseFloat(orderDiscount) || 0, orderSubtotal);
  const orderTotal = Math.max(0, orderSubtotal - orderDiscountAmt);
  const orderPaid = parseFloat(orderAmountPaid) || orderTotal;

  // ─── Submit Wholesale Order ──────────────────────────────────────────────────
  const handleCompleteWholesaleOrder = async () => {
    if (!orderCustomer) {
      showNotification('Please select a wholesale customer for this order.', 'error');
      return;
    }
    if (orderItems.length === 0) {
      showNotification('Please add at least one product with quantity to the order.', 'error');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const invoice = await wholesaleService.createOrder({
        customer_id: orderCustomer.id,
        items: orderItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount_amount: orderDiscountAmt,
        payment_method: orderPaymentMethod,
        amount_paid: orderPaid,
        notes: orderNotes
          ? `[Wholesale Order] ${orderNotes}`
          : `Wholesale order for ${orderCustomer.company_name || orderCustomer.name}`,
      });

      setReceiptInvoice(invoice);
      showNotification(`Wholesale Order ${invoice.invoice_number} successfully completed!`);
      // Reset order form
      setOrderItems([]);
      setOrderDiscount('0');
      setOrderAmountPaid('');
      setOrderNotes('');
      void loadOrders();
      void loadStats();
      void loadCustomers();
    } catch {
      showNotification('Failed to process wholesale order in database.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ─── Customer Creation ───────────────────────────────────────────────────────
  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim() || !customerFormData.phone?.trim()) {
      showNotification('Customer name and phone number are required.', 'error');
      return;
    }

    setIsSubmittingCustomer(true);
    try {
      const created = await wholesaleService.createClient({
        name: customerFormData.name.trim(),
        phone: customerFormData.phone.trim(),
        email: customerFormData.email?.trim() || undefined,
        company_name: customerFormData.company_name?.trim() || undefined,
        address: customerFormData.address?.trim() || undefined,
      });

      showNotification(`Wholesale Client "${created.name}" created successfully.`);
      setIsCustomerModalOpen(false);
      setCustomerFormData({ name: '', phone: '', email: '', company_name: '', address: '' });
      await loadCustomers();
      void loadStats();

      // If user was on order tab, auto-select newly created customer
      if (activeTab === 'order') {
        setOrderCustomer(created);
        setOrderCustomerSearch(created.name);
      }
    } catch {
      showNotification('Failed to create wholesale customer.', 'error');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleStartOrderForCustomer = (cust: WholesaleClient) => {
    setOrderCustomer(cust);
    setOrderCustomerSearch(cust.name);
    setActiveTab('order');
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Wholesale & B2B Distribution</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eb4826]/15 text-[#eb4826] border border-[#eb4826]/30">
              Bulk Supply
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Manage wholesale clients, assign bulk products & quantities, and issue wholesale invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1e26] hover:bg-[#252834] text-white text-sm font-semibold border border-[#2e323e] transition shadow-sm"
          >
            <span>+ Register Wholesale Client</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb4826] hover:bg-[#ff5733] text-white text-sm font-semibold transition shadow-lg shadow-[#eb4826]/20"
          >
            <span>⚡ New Wholesale Order</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* ── KPI Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#17181c] border border-[#292b31] shadow-lg">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Wholesale Accounts</div>
          <div className="text-2xl font-black text-white">{wholesaleMetrics.clientCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Registered shops & workshops</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#17181c] border border-[#292b31] shadow-lg">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Wholesale Invoices</div>
          <div className="text-2xl font-black text-[#eb4826]">{wholesaleMetrics.totalOrders}</div>
          <div className="text-xs text-zinc-500 mt-1">B2B orders completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#17181c] border border-[#292b31] shadow-lg">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Wholesale Volume</div>
          <div className="text-2xl font-black text-emerald-400">{fmt(wholesaleMetrics.totalRevenue)}</div>
          <div className="text-xs text-zinc-500 mt-1">Total revenue generated</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#17181c] border border-[#292b31] shadow-lg">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Avg. Order Value</div>
          <div className="text-2xl font-black text-amber-400">{fmt(wholesaleMetrics.avgOrder)}</div>
          <div className="text-xs text-zinc-500 mt-1">Per wholesale transaction</div>
        </div>
      </div>

      {/* ── Tab Switcher ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#292b31] gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'clients'
              ? 'border-[#eb4826] text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🏢 Wholesale Clients Directory</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'order'
              ? 'border-[#eb4826] text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🛒 New Wholesale Order (Add Products & Qty)</span>
          {orderItems.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#eb4826] text-white font-bold">
              {orderItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[#eb4826] text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>📦 Wholesale Order History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {orders.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: WHOLESALE CLIENTS DIRECTORY
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-[#17181c] p-3 rounded-2xl border border-[#292b31]">
            <input
              type="search"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search wholesale clients by contact name, company/workshop, phone, or location..."
              className="flex-1 bg-[#121316] border border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#70737f] focus:outline-none focus:border-[#eb4826]"
            />
            <span className="text-xs text-[#8a8d99] px-3 font-medium whitespace-nowrap">
              {customers.length} {customers.length === 1 ? 'Client' : 'Clients'}
            </span>
          </div>

          <div className="border border-[#292b31] bg-[#17181c] rounded-2xl overflow-hidden shadow-xl">
            {isLoadingCustomers ? (
              <div className="p-12 text-center text-[#8a8d99] text-sm animate-pulse">
                Loading wholesale clients from database...
              </div>
            ) : customers.length === 0 ? (
              <div className="py-16 text-center text-[#8a8d99] text-sm">
                <p className="text-base font-semibold text-white mb-1">No wholesale clients found</p>
                <p className="text-xs text-[#70737f] mb-4">
                  Register motorcycle workshops, retailers, or garages to supply spare parts in bulk.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#22242b] hover:bg-[#2c2f38] text-white text-xs font-semibold"
                >
                  + Add First Wholesale Client
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#25272e] bg-[#141519] text-[11px] font-semibold text-[#8a8d99] uppercase tracking-wider">
                      <th className="py-3 px-4">Contact & Company</th>
                      <th className="py-3 px-4">Phone / WhatsApp</th>
                      <th className="py-3 px-4">Address / City</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Total Spent</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22242a]">
                    {customers.map((c) => {
                      const stats = customerStatsMap.get(c.id) || { orderCount: 0, totalSpent: 0 };
                      return (
                        <tr key={c.id} className="hover:bg-[#1a1c22] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{c.name}</span>
                              {c.company_name && (
                                <span className="text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                  {c.company_name}
                                </span>
                              )}
                            </div>
                            {c.email && <div className="text-xs text-zinc-500 mt-0.5">{c.email}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {c.phone || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 text-xs">
                            {c.address || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                              {stats.orderCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                            {fmt(stats.totalSpent)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleStartOrderForCustomer(c)}
                              className="px-3 py-1.5 rounded-lg bg-[#eb4826]/15 hover:bg-[#eb4826] text-[#eb4826] hover:text-white text-xs font-semibold transition"
                            >
                              ⚡ New Order
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: NEW WHOLESALE ORDER (ADD PRODUCTS & QUANTITIES)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: CUSTOMER SELECTOR & PRODUCT ADDITION */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wholesale Customer Selection */}
            <div className="p-5 rounded-2xl bg-[#17181c] border border-[#292b31] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  1. Select Wholesale Customer
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs font-semibold text-[#eb4826] hover:underline"
                >
                  + Register New Client
                </button>
              </div>

              {orderCustomer ? (
                <div className="p-4 rounded-xl bg-[#121316] border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{orderCustomer.name}</span>
                      {orderCustomer.company_name && (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {orderCustomer.company_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>📞 {orderCustomer.phone}</span>
                      {orderCustomer.email && <span>✉ {orderCustomer.email}</span>}
                      {orderCustomer.address && <span>📍 {orderCustomer.address}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderCustomer(null);
                      setOrderCustomerSearch('');
                    }}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
                  >
                    Change Client
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={orderCustomerSearch}
                    onChange={(e) => {
                      setOrderCustomerSearch(e.target.value);
                      setShowOrderCustomerDropdown(true);
                    }}
                    onFocus={() => setShowOrderCustomerDropdown(true)}
                    placeholder="Type wholesale customer or workshop name to search..."
                    className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
                  />

                  {showOrderCustomerDropdown && (
                    <div className="absolute z-30 w-full mt-1 bg-[#1a1c24] border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {customers
                        .filter(
                          (c) =>
                            !orderCustomerSearch.trim() ||
                            c.name.toLowerCase().includes(orderCustomerSearch.toLowerCase()) ||
                            (c.company_name && c.company_name.toLowerCase().includes(orderCustomerSearch.toLowerCase())) ||
                            (c.phone && c.phone.includes(orderCustomerSearch))
                        )
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              setOrderCustomer(c);
                              setOrderCustomerSearch(c.name);
                              setShowOrderCustomerDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 text-sm transition"
                          >
                            <div className="font-semibold text-white flex items-center justify-between">
                              <span>{c.name}</span>
                              {c.company_name && (
                                <span className="text-xs text-amber-400 font-normal">[{c.company_name}]</span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5 flex gap-3">
                              <span>📞 {c.phone}</span>
                              {c.address && <span>📍 {c.address}</span>}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product & Quantity Addition Panel */}
            <div className="p-5 rounded-2xl bg-[#17181c] border border-[#292b31] space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span>2. Add Products & Quantities</span>
                  <span className="text-[11px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Quantity Form Active
                  </span>
                </label>
                {selectedProductToAdd && (
                  <span className="text-xs font-mono text-zinc-400">
                    Warehouse Stock: <strong className="text-emerald-400">{selectedProductToAdd.quantity} units</strong> available
                  </span>
                )}
              </div>

              {/* Dedicated Always-Visible Item & Quantity Entry Form */}
              <div className="p-4 rounded-xl bg-[#121316] border border-zinc-700/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Product Search & Selection (cols 5) */}
                  <div className="sm:col-span-5 relative">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Spare Part / Item <span className="text-[#eb4826]">*</span>
                    </label>
                    <input
                      type="text"
                      value={productQuery}
                      onChange={(e) => {
                        setProductQuery(e.target.value);
                        if (selectedProductToAdd && e.target.value !== selectedProductToAdd.name) {
                          setSelectedProductToAdd(null);
                        }
                      }}
                      placeholder="Type part name, SKU, or barcode..."
                      className="w-full bg-[#17181c] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
                    />

                    {showProductDropdown && productSuggestions.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-[#1a1c24] border border-zinc-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                        {productSuggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => handleSelectProduct(p)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-zinc-800 transition text-left border-b border-zinc-800/50"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">{p.name}</div>
                              <div className="text-[11px] font-mono text-zinc-400">
                                {p.code} • Stock:{' '}
                                <span className={p.quantity <= 5 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                                  {p.quantity} units
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono text-emerald-400 font-semibold">
                                Rs. {Number(p.wholesale_price || p.selling_price).toLocaleString()}
                              </div>
                              {p.wholesale_price && (
                                <div className="text-[10px] text-amber-400">Wholesale Rate</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wholesale Quantity (cols 3) - PROMINENT & ALWAYS VISIBLE */}
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-300">
                        Order Qty <span className="text-[#eb4826]">*</span>
                      </label>
                      {selectedProductToAdd && (
                        <span className="text-[10px] text-zinc-400">
                          Max: {selectedProductToAdd.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedProductToAdd ? selectedProductToAdd.quantity : 9999}
                        value={addQty}
                        onChange={(e) => setAddQty(parseInt(e.target.value) || 1)}
                        className="w-full text-center bg-[#17181c] border border-zinc-700 rounded-lg py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#eb4826]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAddQty((q) =>
                            selectedProductToAdd ? Math.min(selectedProductToAdd.quantity, q + 1) : q + 1
                          )
                        }
                        className="w-8 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Wholesale Bulk Quantity Buttons */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[5, 10, 25, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setAddQty(
                              selectedProductToAdd ? Math.min(selectedProductToAdd.quantity, preset) : preset
                            )
                          }
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wholesale Unit Price (cols 2) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Wholesale Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#17181c] border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-emerald-400 font-mono font-semibold focus:outline-none focus:border-[#eb4826]"
                    />
                    <div className="text-[10px] text-zinc-500 mt-1 truncate">
                      Total: Rs. {((parseFloat(addPrice) || 0) * addQty).toLocaleString()}
                    </div>
                  </div>

                  {/* Add to Order Button (cols 2) */}
                  <div className="sm:col-span-2 flex items-start pt-6">
                    <button
                      type="button"
                      onClick={handleAddProductToOrder}
                      className="w-full py-2.5 rounded-lg bg-[#eb4826] hover:bg-[#ff5733] text-white text-xs font-bold transition shadow-md shadow-[#eb4826]/30 flex items-center justify-center gap-1"
                    >
                      <span>+ Add Item</span>
                    </button>
                  </div>
                </div>

                {selectedProductToAdd && (
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                    <span>
                      Selected:{' '}
                      <strong className="text-white">
                        {selectedProductToAdd.name} ({selectedProductToAdd.code})
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductToAdd(null);
                        setProductQuery('');
                        setAddPrice('');
                      }}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕ Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {/* Items Table in Order */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#121316]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181a22] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-center">Available</th>
                      <th className="py-2.5 px-3 text-center w-28">Order Qty</th>
                      <th className="py-2.5 px-3 text-right w-32">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orderItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No products added to this wholesale order yet.
                        </td>
                      </tr>
                    ) : (
                      orderItems.map((item) => (
                        <tr key={item.product.id} className="hover:bg-zinc-800/30">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{item.product.name}</div>
                            <div className="font-mono text-[11px] text-zinc-500">{item.product.code}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-zinc-400">
                            {item.product.quantity}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.product.id, item.quantity - 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.product.quantity}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItemQty(item.product.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 text-center bg-[#17181c] border border-zinc-700 rounded py-1 text-xs font-bold text-white focus:outline-none focus:border-[#eb4826]"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.quantity}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItemPrice(item.product.id, e.target.value)}
                              className="w-24 text-right bg-[#17181c] border border-zinc-700 rounded px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-[#eb4826]"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {fmt(item.line_total)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(item.product.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: ORDER SUMMARY & SUBMISSION */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#17181c] border border-[#292b31] space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-3">
                Order Settlement
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Items Count</span>
                  <span className="font-semibold text-white">{orderItems.reduce((acc, i) => acc + i.quantity, 0)} units</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{fmt(orderSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Wholesale Discount (Rs.)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(e.target.value)}
                    className="w-28 text-right bg-[#121316] border border-zinc-700 rounded-lg px-2 py-1 text-sm text-amber-400 focus:outline-none focus:border-[#eb4826]"
                  />
                </div>
                <div className="flex justify-between font-black text-xl text-white border-t border-zinc-700 pt-3">
                  <span>TOTAL</span>
                  <span className="text-[#eb4826]">{fmt(orderTotal)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Payment Terms / Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bank_transfer', 'cash', 'card'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setOrderPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition capitalize ${
                        orderPaymentMethod === method
                          ? 'bg-[#eb4826] border-[#eb4826] text-white shadow-lg shadow-red-600/20'
                          : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Amount Received / Settled (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderAmountPaid}
                  onChange={(e) => setOrderAmountPaid(e.target.value)}
                  placeholder={orderTotal.toFixed(2)}
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Order / PO Reference Notes
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. PO-8841, 30-day payment term, dispatch via lorry"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <button
                type="button"
                onClick={handleCompleteWholesaleOrder}
                disabled={isSubmittingOrder || orderItems.length === 0 || !orderCustomer}
                className="w-full py-3.5 rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-white font-bold text-sm shadow-lg shadow-[#eb4826]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingOrder ? 'Processing Wholesale Order…' : `✓ Complete Wholesale Order (${fmt(orderTotal)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: WHOLESALE ORDER HISTORY
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="border border-[#292b31] bg-[#17181c] rounded-2xl overflow-hidden shadow-xl">
          {isLoadingOrders ? (
            <div className="p-12 text-center text-[#8a8d99] text-sm animate-pulse">
              Loading wholesale orders from backend database...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-[#8a8d99] text-sm">
              <p className="text-base font-semibold text-white mb-1">No wholesale invoices recorded</p>
              <p className="text-xs text-[#70737f] mb-4">Complete your first wholesale order above.</p>
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className="px-4 py-2 rounded-xl bg-[#22242b] hover:bg-[#2c2f38] text-white text-xs font-semibold"
              >
                + Create Wholesale Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#25272e] bg-[#141519] text-[11px] font-semibold text-[#8a8d99] uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Wholesale Client</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242a]">
                  {orders.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#1a1c22] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">
                          {inv.customer_name || 'Wholesale Client'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {new Date(inv.created_at).toLocaleString('en-LK')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                        {inv.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="py-3.5 px-4 text-xs capitalize text-zinc-300">
                        {inv.payment_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {fmt(inv.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Register New Wholesale Customer ────────────────────────────── */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#17181c] border border-zinc-700 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold">Register Wholesale Client</h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Contact Person / Owner Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sunil Jayawardena"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Company / Workshop / Dealership Name
                </label>
                <input
                  type="text"
                  value={customerFormData.company_name ?? ''}
                  onChange={(e) => setCustomerFormData((p) => ({ ...p, company_name: e.target.value }))}
                  placeholder="e.g. Sunil Motors & Service Center"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Phone / WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerFormData.phone ?? ''}
                  onChange={(e) => setCustomerFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 0771234567"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerFormData.email ?? ''}
                  onChange={(e) => setCustomerFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. sunil@motors.lk"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Business Address / City</label>
                <input
                  type="text"
                  value={customerFormData.address ?? ''}
                  onChange={(e) => setCustomerFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. No. 120, Kandy Road, Kadawatha"
                  className="w-full bg-[#121316] border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="px-4 py-2 rounded-xl bg-[#eb4826] hover:bg-[#ff5733] text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {isSubmittingCustomer ? 'Saving…' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Receipt Preview ────────────────────────────────────────────── */}
      {receiptInvoice && (
        <InvoiceReceipt
          invoice={receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};
