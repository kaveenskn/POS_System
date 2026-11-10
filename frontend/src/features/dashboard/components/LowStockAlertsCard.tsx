import { useNavigate } from 'react-router-dom';
import type { LowStockAlert } from '../../../types/dashboard.types';
import { Icon } from './Icon';

interface LowStockAlertsCardProps {
  alerts: LowStockAlert[];
}

export function LowStockAlertsCard({ alerts }: LowStockAlertsCardProps) {
  const navigate = useNavigate();

  return (
    <div className="border border-[#292b31] bg-[#17181c] rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Icon name="warning" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Stock Reorder Warnings</h3>
              <p className="text-xs text-[#8a8d99]">Products at or below designated threshold</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="text-xs text-[#f05232] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Manage All</span>
            <Icon name="chevron" size={14} />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-10 text-center text-emerald-400 text-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400">
              <Icon name="check" size={24} />
            </div>
            <p className="font-semibold text-white mb-1">Inventory Levels Healthy</p>
            <p className="text-xs text-[#70737f]">All tracked parts are above their minimum reorder thresholds.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#121316] border border-[#22242a] flex items-center justify-between gap-3 hover:border-[#333640] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                    {item.is_out_of_stock ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#8a8d99] font-mono">{item.code}</span>
                    <span className="text-[11px] text-[#70737f]">{item.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">
                    <span className={item.is_out_of_stock ? 'text-rose-400' : 'text-amber-400'}>
                      {item.quantity}
                    </span>{' '}
                    <span className="text-xs text-[#80838f]">/ Min {item.min_stock_level}</span>
                  </div>
                  <div className="text-xs text-[#8a8d99] mt-0.5">
                    Selling: Rs. {item.selling_price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#22242a] flex items-center justify-between text-xs text-[#8a8d99]">
        <span>Requires restocking to prevent sales disruption</span>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className="text-xs font-semibold text-[#f05232] hover:text-[#ff6547]"
        >
          Adjust Stock Levels →
        </button>
      </div>
    </div>
  );
}

