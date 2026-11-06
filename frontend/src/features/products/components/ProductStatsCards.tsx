import type { FC } from 'react';
import type { ProductStatistics, StockStatus } from '../../../types/product.types';

interface ProductStatsCardsProps {
  stats: ProductStatistics;
  currentStockFilter?: StockStatus;
  currentStatusFilter?: string;
  onFilterSelect: (type: 'stock' | 'status' | 'all', val?: string) => void;
}

export const ProductStatsCards: FC<ProductStatsCardsProps> = ({
  stats,
  currentStockFilter,
  currentStatusFilter,
  onFilterSelect,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Products',
      value: stats.total_products.toLocaleString(),
      subtext: 'Catalog spare parts',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      colorTone: 'gray',
      isActive: currentStockFilter === 'all' && currentStatusFilter === 'all',
      onClick: () => onFilterSelect('all'),
    },
    {
      id: 'active',
      label: 'Active Products',
      value: stats.active_products.toLocaleString(),
      subtext: 'Available for POS sales',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorTone: 'green',
      isActive: currentStatusFilter === 'active',
      onClick: () => onFilterSelect('status', 'active'),
    },
    {
      id: 'low_stock',
      label: 'Low Stock Products',
      value: stats.low_stock_products.toLocaleString(),
      subtext: 'At or below reorder level',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      colorTone: 'yellow',
      isActive: currentStockFilter === 'low_stock',
      onClick: () => onFilterSelect('stock', 'low_stock'),
    },
    {
      id: 'out_of_stock',
      label: 'Out of Stock',
      value: stats.out_of_stock_products.toLocaleString(),
      subtext: 'Replenishment needed',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      colorTone: 'red',
      isActive: currentStockFilter === 'out_of_stock',
      onClick: () => onFilterSelect('stock', 'out_of_stock'),
    },
    {
      id: 'inventory_value',
      label: 'Total Inventory Value',
      value: `Rs. ${stats.total_inventory_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtext: 'At cost valuation',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorTone: 'orange',
      isActive: false,
      onClick: () => onFilterSelect('all'),
    },
    {
      id: 'categories',
      label: 'Categories',
      value: stats.categories_count.toLocaleString(),
      subtext: 'Part classifications',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      colorTone: 'gray',
      isActive: false,
      onClick: () => onFilterSelect('all'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        let toneBg = 'bg-[#2b2d34] text-[#c4c7d0]';
        if (card.colorTone === 'orange') toneBg = 'bg-[#f0442f]/15 text-[#f0442f]';
        if (card.colorTone === 'green') toneBg = 'bg-[#20b968]/15 text-[#20b968]';
        if (card.colorTone === 'yellow') toneBg = 'bg-[#e8a91b]/15 text-[#e8a91b]';
        if (card.colorTone === 'red') toneBg = 'bg-rose-500/15 text-rose-400';

        return (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className={`text-left p-4 rounded-2xl bg-[#17181c] border transition-all duration-200 relative group overflow-hidden ${
              card.isActive
                ? 'border-[#f0442f] shadow-lg shadow-red-950/20 bg-[#1e2026]'
                : 'border-[#292b31] hover:border-[#3d404a] hover:bg-[#1b1d22]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#9a9ca6] line-clamp-1">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${toneBg}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#f3f4f6] tracking-tight mb-1">
              {card.value}
            </div>
            <div className="text-[11px] text-[#6f727d] line-clamp-1">
              {card.subtext}
            </div>
          </button>
        );
      })}
    </div>
  );
};

