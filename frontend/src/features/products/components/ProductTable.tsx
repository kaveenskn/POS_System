import { useState } from 'react';
import type { FC } from 'react';
import type { Product } from '../../../types/product.types';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onViewStockHistory: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onArchiveProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const ProductTable: FC<ProductTableProps> = ({
  products,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewProduct,
  onEditProduct,
  onDuplicateProduct,
  onPrintBarcode,
  onAdjustStock,
  onViewStockHistory,
  onToggleStatus,
  onArchiveProduct,
  onDeleteProduct,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const isAllSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const toggleDropdown = (id: number) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-2xl border border-[#292b31] bg-[#17181c] overflow-hidden shadow-xl">
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left text-sm text-[#f3f4f6]">
          <thead className="bg-[#1b1c22] text-[11px] font-semibold uppercase tracking-wider text-[#9a9ca6] border-b border-[#292b31]">
            <tr>
              <th className="px-4 py-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#292b31] bg-[#121316] text-[#f0442f] focus:ring-[#f0442f] focus:ring-offset-0 cursor-pointer"
                  aria-label="Select all products"
                />
              </th>
              <th className="px-3 py-3.5 w-14">Image</th>
              <th className="px-4 py-3.5 min-w-[200px]">Part / Model</th>
              <th className="px-4 py-3.5">SKU</th>
              <th className="px-4 py-3.5">Barcode</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Brand</th>
              <th className="px-4 py-3.5 text-right">Cost (Rs.)</th>
              <th className="px-4 py-3.5 text-right">Retail (Rs.)</th>
              <th className="px-4 py-3.5 text-center">Stock</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#292b31]/60">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="px-6 py-16 text-center text-[#9a9ca6]">
                  <div className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin text-[#f0442f]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Loading inventory products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[#22242b] border border-[#292b31] flex items-center justify-center text-[#9a9ca6] mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-white">No products found</p>
                    <p className="text-xs text-[#9a9ca6] mt-1 text-center">
                      Try adjusting your search criteria or add a new spare part to your catalog.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = !isOutOfStock && item.quantity <= item.min_stock_level;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-[#202229] ${
                      isSelected ? 'bg-[#f0442f]/5' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="rounded border-[#292b31] bg-[#121316] text-[#f0442f] focus:ring-[#f0442f] focus:ring-offset-0 cursor-pointer"
                        aria-label={`Select ${item.name}`}
                      />
                    </td>

                    {/* Image */}
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 rounded-xl bg-[#22242b] border border-[#292b31] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback placeholder
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#6f727d]">
                            {item.brand.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name & Compatible Models */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onViewProduct(item)}
                        className="font-bold text-white hover:text-[#f0442f] transition text-left line-clamp-1 block"
                      >
                        {item.name}
                      </button>
                      {item.compatible_models && (
                        <div className="text-[11px] text-[#9a9ca6] line-clamp-1 mt-0.5 flex items-center gap-1">
                          <span className="text-[#f0442f] font-mono">🏍</span>
                          <span>{item.compatible_models}</span>
                        </div>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#f0442f] bg-[#f0442f]/10 px-2 py-0.5 rounded-md border border-[#f0442f]/20">
                        {item.code}
                      </span>
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-3">
                      <BarcodeBadge
                        value={item.barcode || item.code}
                        size="compact"
                        showNumber={true}
                        onPrint={() => onPrintBarcode(item)}
                      />
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-xs text-[#9a9ca6]">
                      <span className="line-clamp-1">{item.category}</span>
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
                        {item.brand}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#9a9ca6]">
                      {Number(item.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Selling */}
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-white">
                      {Number(item.selling_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Stock & Unit */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isLowStock
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>

                    {/* Product Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'inactive'
                            ? 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/40'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Row Actions Menu */}
                    <td className="px-4 py-3 text-right relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown(item.id)}
                        className="p-1.5 rounded-lg text-[#9a9ca6] hover:text-white hover:bg-[#292b31] transition"
                        aria-label="Product actions"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div className="absolute right-0 top-12 z-30 w-52 rounded-xl bg-[#1b1c22] border border-[#292b31] p-1.5 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onViewProduct(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>👁</span>
                              <span>View Product Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onEditProduct(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>✏️</span>
                              <span>Edit Product</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onDuplicateProduct(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>📑</span>
                              <span>Duplicate Product</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onPrintBarcode(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>🏷️</span>
                              <span>Print Barcode Label</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onAdjustStock(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>📦</span>
                              <span>Adjust Stock</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onViewStockHistory(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>📜</span>
                              <span>Stock Movement Log</span>
                            </button>

                            <div className="my-1 border-t border-[#292b31]" />

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onToggleStatus(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f3f4f6] hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>{item.status === 'active' ? '⏸️' : '▶️'}</span>
                              <span>{item.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onArchiveProduct(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9a9ca6] hover:text-white hover:bg-[#292b31] rounded-lg transition"
                            >
                              <span>📁</span>
                              <span>Archive Product</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                onDeleteProduct(item);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              <span>🗑️</span>
                              <span>Delete Product</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#292b31] bg-[#17181c] text-xs text-[#9a9ca6]">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[#121316] border border-[#292b31] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#f0442f]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="ml-2">
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
          </span>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 rounded-lg border border-[#292b31] bg-[#22242b] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#292b31] transition"
          >
            Previous
          </button>

          <div className="px-3 py-1 text-xs text-white font-medium">
            Page {currentPage} of {totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 rounded-lg border border-[#292b31] bg-[#22242b] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#292b31] transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

