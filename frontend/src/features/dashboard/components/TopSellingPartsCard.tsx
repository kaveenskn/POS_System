import type { TopSellingProduct } from '../../../types/dashboard.types';
import { Icon } from './Icon';

interface TopSellingPartsCardProps {
  products: TopSellingProduct[];
}

export function TopSellingPartsCard({ products }: TopSellingPartsCardProps) {
  return (
    <div className="border border-[#292b31] bg-[#17181c] rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#f05232] flex items-center justify-center">
              <Icon name="trend" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Top Fast-Moving Parts</h3>
              <p className="text-xs text-[#8a8d99]">Best-selling motorcycle components by quantity</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8d99] bg-[#121316] px-2.5 py-1 rounded-lg border border-[#25272e]">
            {products.length} {products.length === 1 ? 'part' : 'parts'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-10 text-center text-[#8a8d99] text-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#1b1c22] flex items-center justify-center mb-2 text-[#60636d]">
              <Icon name="package" size={24} />
            </div>
            <p className="font-medium text-white mb-1">No sales recorded yet</p>
            <p className="text-xs text-[#70737f]">Complete your first sale in POS to see top moving inventory.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {products.map((prod, index) => {
              const rankColor =
                index === 0
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : index === 1
                  ? 'bg-slate-300/15 text-slate-300 border-slate-300/30'
                  : index === 2
                  ? 'bg-orange-700/20 text-orange-400 border-orange-700/30'
                  : 'bg-[#22242a] text-[#8e919e] border-[#2c2f38]';

              return (
                <div
                  key={`${prod.product_code}-${index}`}
                  className="p-3.5 rounded-xl bg-[#121316] border border-[#22242a] flex items-center justify-between gap-3 hover:border-[#333640] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${rankColor}`}
                    >
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{prod.product_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#f05232] font-mono">{prod.product_code}</span>
                        <span className="text-[11px] text-[#70737f] px-1.5 py-0.5 rounded bg-[#1c1d22]">
                          {prod.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">
                      {prod.units_sold} {prod.units_sold === 1 ? 'unit' : 'units'} sold
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">
                      Rs. {prod.total_revenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#22242a] flex items-center justify-between text-xs text-[#8a8d99]">
        <span>Aggregated from live invoice records</span>
        <span className="text-[#a0a3b0] font-medium">TorqueLine Analytics</span>
      </div>
    </div>
  );
}
