import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { productService } from '../../services/productService';
import type { Product, ProductCreateInput, StockAdjustmentInput } from '../../types/product.types';
import { ProductFormModal } from './components/ProductFormModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 });

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export const InventoryPage: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({ limit: 100 });
      setProducts(data.items ?? []);
    } catch {
      showNotification('Failed to load inventory. Please check connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Unique categories for the dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Client-side filtering for fast responsive typing
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCode = p.code?.toLowerCase().includes(q);
        const matchesBarcode = p.barcode?.toLowerCase().includes(q);
        const matchesBrand = p.brand?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesBarcode && !matchesBrand) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }

      // Stock filter
      if (stockFilter === 'out_of_stock' && p.quantity > 0) return false;
      if (stockFilter === 'low_stock' && (p.quantity <= 0 || p.quantity > p.min_stock_level)) return false;
      if (stockFilter === 'in_stock' && p.quantity <= p.min_stock_level) return false;

      return true;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // KPI calculations
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level).length;
  const outOfStockCount = products.filter((p) => p.quantity <= 0).length;
  const totalValue = products.reduce(
    (sum, p) => sum + (Number(p.cost_price) || 0) * (Number(p.quantity) || 0),
    0
  );

  // Handlers
  const handleSaveProduct = async (data: ProductCreateInput) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        showNotification(`Part "${data.name}" updated successfully.`);
      } else {
        await productService.createProduct(data);
        showNotification(`Part "${data.name}" added to inventory.`);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      showNotification(e?.message ?? 'Failed to save product.', 'error');
    }
  };

  const handleAdjustStock = async (productId: number, data: StockAdjustmentInput) => {
    try {
      await productService.adjustStock(productId, data);
      showNotification('Stock quantity updated successfully.');
      setAdjustingProduct(null);
      await loadProducts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      showNotification(e?.message ?? 'Failed to adjust stock.', 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}" (${product.code})?`)) {
      return;
    }
    try {
      await productService.deleteProduct(product.id);
      showNotification(`Deleted "${product.name}".`);
      await loadProducts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      showNotification(e?.message ?? 'Failed to delete product.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Stock</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage motorcycle spare parts, track stock quantities, update prices, and generate barcodes
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#eb4826] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-[#ff5534] active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Product</span>
        </button>
      </div>

      {/* ── Notification Toast ─────────────────────────────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-zinc-500 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Total Parts
          </div>
          <div className="text-2xl font-bold font-mono text-white">{products.length}</div>
          <div className="text-xs text-zinc-500 mt-1">{categories.length} categories</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Units in Stock
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{totalUnits}</div>
          <div className="text-xs text-zinc-500 mt-1">Available for sales</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Stock Alerts
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {lowStockCount + outOfStockCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {outOfStockCount > 0 ? `${outOfStockCount} out of stock, ` : ''}
            {lowStockCount} low stock
          </div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Inventory Valuation
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {fmt(totalValue)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Total cost value</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#14161d] border border-zinc-800 rounded-2xl p-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍  Search by part name, code, barcode, or brand..."
            className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-[#eb4826]"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1 bg-[#0b0c10] border border-zinc-800 rounded-xl p-1 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Out' },
            ] as { id: StockFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStockFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                stockFilter === tab.id
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inventory Products Table ───────────────────────────────────── */}
      <div className="bg-[#14161d] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-300 text-left">
            <thead className="bg-[#181a22] border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3.5">Part Details</th>
                <th className="px-4 py-3.5">SKU & Barcode</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Cost Price</th>
                <th className="px-4 py-3.5 text-right">Selling Price</th>
                <th className="px-4 py-3.5 text-center">Stock Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <span className="inline-block animate-spin w-5 h-5 border-2 border-[#eb4826] border-t-transparent rounded-full mr-2" />
                    Loading inventory parts...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No products found. {searchTerm ? `No matches for "${searchTerm}".` : 'Add your first product above.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = !isOutOfStock && p.quantity <= p.min_stock_level;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Name & Brand */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Brand: <span className="text-zinc-300 font-medium">{p.brand || 'TorqueLine'}</span>
                          {p.warehouse_location && (
                            <span className="ml-2 text-zinc-500">• 📍 {p.warehouse_location}</span>
                          )}
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-[#eb4826]">{p.code}</div>
                        {p.barcode ? (
                          <div className="font-mono text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                            <span>📦</span>
                            <span>{p.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-600">No barcode</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-400">
                        {fmt(Number(p.cost_price))}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                        {fmt(Number(p.selling_price))}
                      </td>

                      {/* Stock & Status */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                              isOutOfStock
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : isLowStock
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {p.quantity} {p.unit}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Adjust */}
                          <button
                            type="button"
                            onClick={() => setAdjustingProduct(p)}
                            title="Quick Adjust Stock"
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
                          >
                            ± Stock
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsFormOpen(true);
                            }}
                            title="Edit details"
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete part"
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Product Add/Edit Modal ─────────────────────────────────────── */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* ── Quick Stock Adjustment Modal ───────────────────────────────── */}
      <StockAdjustmentModal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        product={adjustingProduct}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
};

