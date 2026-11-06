import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { ProductFormModal } from './components/ProductFormModal';
import { productService } from '../../services/productService';
import type { Product, ProductCreateInput } from '../../types/product.types';

export const ProductsPage: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = async (searchTerm = '') => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });
      setProducts(data.items);
      setTotal(data.total);
    } catch {
      // If backend is not reached yet or database is still syncing
      console.warn('Could not fetch products from API, checking local data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(search);
  }, [search]);

  const handleAddProduct = async (data: ProductCreateInput) => {
    setIsSubmitting(true);
    try {
      const created = await productService.createProduct(data);
      setProducts((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      setNotification(`Product "${created.name}" created successfully!`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setNotification(`Product "${name}" deleted.`);
      setTimeout(() => setNotification(null), 4000);
    } catch {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products & Inventory</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your parts catalog, pricing, and stock levels ({total} items registered)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#eb4826] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-[#ff5534] active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <span>✓ {notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-[#14161d] p-3 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by part name, SKU code, or brand..."
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#14161d]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#181a22] text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Part / SKU</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4 text-right">Cost Price</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-right">Margin</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Loading inventory products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No products found. Click "Add Product" to add your first spare part!
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const margin = item.selling_price - item.cost_price;
                  const marginPct = item.cost_price > 0 ? (margin / item.cost_price) * 100 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-xs font-mono text-[#eb4826]">{item.code}</div>
                        {item.description && (
                          <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {item.brand}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        Rs. {Number(item.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400 font-semibold">
                        Rs. {Number(item.selling_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        <span className={margin >= 0 ? 'text-zinc-400' : 'text-rose-400'}>
                          +{marginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            item.quantity <= 3
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(item.id, item.name)}
                          className="text-xs text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                          title="Delete Product"
                        >
                          <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProduct}
        isLoading={isSubmitting}
      />
    </div>
  );
};

