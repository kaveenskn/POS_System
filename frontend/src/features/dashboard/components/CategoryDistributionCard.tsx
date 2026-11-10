import type { CategoryBreakdown } from '../../../types/dashboard.types';
import { Icon } from './Icon';

interface CategoryDistributionCardProps {
  categories: CategoryBreakdown[];
}

export function CategoryDistributionCard({ categories }: CategoryDistributionCardProps) {
  const totalStock = categories.reduce((sum, c) => sum + c.stock_units, 0);

  return (
    <div className="border border-[#292b31] bg-[#17181c] rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Icon name="tag" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Category Inventory Spread</h3>
            <p className="text-xs text-[#8a8d99]">Stock volume and valuation by motorcycle component category</p>
          </div>
        </div>
        <span className="text-xs text-[#8a8d99] bg-[#121316] px-2.5 py-1 rounded-lg border border-[#25272e]">
          {categories.length} Categories
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-[#8a8d99] text-sm">
          <p>No category distribution available.</p>
        </div>
      ) : (
        <div className="space-y-3.5 mt-3">
          {categories.map((cat) => {
            const percentage = totalStock > 0 ? Math.round((cat.stock_units / totalStock) * 100) : 0;
            return (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{cat.category}</span>
                  <div className="flex items-center gap-2 text-[#8a8d99]">
                    <span>
                      {cat.product_count} {cat.product_count === 1 ? 'part' : 'parts'} ({cat.stock_units} units)
                    </span>
                    <span className="text-emerald-400 font-medium">
                      Rs. {cat.inventory_value.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#121316] h-2 rounded-full overflow-hidden border border-[#22242a]">
                  <div
                    className="h-full bg-gradient-to-r from-[#f04b2f] to-[#ff7d59] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

