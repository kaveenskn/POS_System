import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { Brand, Category, StockStatus } from '../../../types/product.types';

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  brand: string;
  onBrandChange: (val: string) => void;
  stockStatus: StockStatus;
  onStockStatusChange: (val: StockStatus) => void;
  productStatus: string;
  onProductStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  onClearFilters: () => void;
  categories: Category[];
  brands: Brand[];
  totalResults: number;
}

export const ProductFilterBar: FC<ProductFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  stockStatus,
  onStockStatusChange,
  productStatus,
  onProductStatusChange,
  sortBy,
  onSortByChange,
  onClearFilters,
  categories,
  brands,
  totalResults,
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 280);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'all' ||
    brand !== 'all' ||
    stockStatus !== 'all' ||
    productStatus !== 'all';

  return (
    <div className="space-y-3 bg-[#17181c] border border-[#292b31] p-4 rounded-2xl">
      {/* Primary Row: Search + Key Selects + Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input with debouncing */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f727d]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search part name, SKU, barcode, compatible bike model (e.g. Honda Dio)..."
            className="w-full bg-[#121316] border border-[#292b31] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6f727d] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="min-w-[160px]">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Dropdown */}
        <div className="min-w-[140px]">
          <select
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="min-w-[150px]">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="selling_price-asc">Price (Low to High)</option>
            <option value="selling_price-desc">Price (High to Low)</option>
            <option value="quantity-asc">Stock (Low to High)</option>
            <option value="quantity-desc">Stock (High to Low)</option>
          </select>
        </div>

        {/* Toggle Advanced Filters */}
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-1.5 ${
            showAdvanced || stockStatus !== 'all' || productStatus !== 'all'
              ? 'border-[#f0442f]/40 bg-[#f0442f]/10 text-[#f0442f]'
              : 'border-[#292b31] bg-[#121316] text-[#9a9ca6] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
        </button>
      </div>

      {/* Advanced Filter Row (collapsible) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-[#292b31] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Stock Status */}
          <div>
            <label className="block text-xs text-[#9a9ca6] mb-1.5">Stock Status</label>
            <select
              value={stockStatus}
              onChange={(e) => onStockStatusChange(e.target.value as StockStatus)}
              className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
            >
              <option value="all">All Inventory Levels</option>
              <option value="in_stock">In Stock (Healthy)</option>
              <option value="low_stock">Low Stock (At or Below Min)</option>
              <option value="out_of_stock">Out of Stock (Zero)</option>
            </select>
          </div>

          {/* Product Status */}
          <div>
            <label className="block text-xs text-[#9a9ca6] mb-1.5">Product Status</label>
            <select
              value={productStatus}
              onChange={(e) => onProductStatusChange(e.target.value)}
              className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Sellable)</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Result Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#292b31]/60 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#6f727d]">
            Showing <strong className="text-[#f3f4f6]">{totalResults}</strong> parts
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
              Search: "{search}"
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="hover:text-red-400 ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
              Category: {category}
              <button type="button" onClick={() => onCategoryChange('all')} className="hover:text-red-400 ml-0.5">
                ✕
              </button>
            </span>
          )}

          {brand !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
              Brand: {brand}
              <button type="button" onClick={() => onBrandChange('all')} className="hover:text-red-400 ml-0.5">
                ✕
              </button>
            </span>
          )}

          {stockStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
              Stock: {stockStatus.replace('_', ' ')}
              <button type="button" onClick={() => onStockStatusChange('all')} className="hover:text-red-400 ml-0.5">
                ✕
              </button>
            </span>
          )}

          {productStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242b] text-[#f3f4f6] border border-[#292b31]">
              Status: {productStatus}
              <button type="button" onClick={() => onProductStatusChange('all')} className="hover:text-red-400 ml-0.5">
                ✕
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onClearFilters();
            }}
            className="text-xs font-medium text-[#f0442f] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

