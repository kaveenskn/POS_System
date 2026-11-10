import { useNavigate } from 'react-router-dom';
import type { RecentActivity } from '../../../types/dashboard.types';
import { Icon } from './Icon';

interface RecentInvoicesCardProps {
  invoices: RecentActivity[];
}

export function RecentInvoicesCard({ invoices }: RecentInvoicesCardProps) {
  const navigate = useNavigate();

  const getPaymentBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m === 'cash') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          Cash
        </span>
      );
    }
    if (m === 'card') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
          Card
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
        Bank Transfer
      </span>
    );
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleDateString('en-LK', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-[#292b31] bg-[#17181c] rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#25272f] text-white flex items-center justify-center">
            <Icon name="clock" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Recent POS Sales Feed</h3>
            <p className="text-xs text-[#8a8d99]">Live stream of finalized customer invoices</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/sales')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121316] hover:bg-[#1f2026] border border-[#272932] text-xs font-semibold text-white transition-colors"
        >
          <span>Open Sales History</span>
          <Icon name="arrow-up-right" size={14} />
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="py-12 text-center text-[#8a8d99] text-sm">
          <div className="w-12 h-12 rounded-full bg-[#1b1c22] flex items-center justify-center mx-auto mb-2 text-[#60636d]">
            <Icon name="cart" size={24} />
          </div>
          <p className="font-medium text-white mb-1">No transactions registered yet</p>
          <p className="text-xs text-[#70737f]">Open the POS terminal to process your first sale.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#22242a] text-[11px] font-semibold text-[#8a8d99] uppercase tracking-wider">
                <th className="pb-3 pl-2">Invoice #</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Customer / Counter</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-center">Items</th>
                <th className="pb-3 text-right pr-2">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2026] text-sm">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-[#14151a] transition-colors group cursor-pointer"
                  onClick={() => navigate('/sales')}
                >
                  <td className="py-3.5 pl-2 font-mono font-semibold text-[#f05232] group-hover:text-[#ff6547]">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 text-xs text-[#8a8d99] whitespace-nowrap">
                    {formatTimestamp(inv.created_at)}
                  </td>
                  <td className="py-3.5 font-medium text-white truncate max-w-[200px]">
                    {inv.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="py-3.5 whitespace-nowrap">
                    {getPaymentBadge(inv.payment_method)}
                  </td>
                  <td className="py-3.5 text-center text-xs text-[#8a8d99]">
                    {inv.items_count} {inv.items_count === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 pr-2 text-right font-bold text-white whitespace-nowrap">
                    Rs. {inv.total_amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
