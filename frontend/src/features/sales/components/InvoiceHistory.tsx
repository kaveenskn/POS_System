import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { InvoiceResponse } from '../../../types/invoice.types';
import { invoiceService } from '../../../services/invoiceService';
import { InvoiceReceipt } from './InvoiceReceipt';

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 });

const paymentLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
};

export const InvoiceHistory: FC = () => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<InvoiceResponse | null>(null);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await invoiceService.getInvoices({
        search: search.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        skip,
        limit,
      });
      setInvoices(data.items);
      setTotal(data.total);
    } catch {
      console.warn('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, skip]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-[#14161d] p-3 rounded-2xl border border-zinc-800">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          placeholder="Search invoice # or customer..."
          className="flex-1 min-w-[180px] bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setSkip(0); }}
          className="bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
        />
        <span className="text-zinc-500 text-xs">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setSkip(0); }}
          className="bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
        />
        <button
          type="button"
          onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setSkip(0); }}
          className="px-3 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-xl hover:bg-zinc-800 transition"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#14161d]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#181a22] text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-3 font-mono text-[#eb4826] font-semibold text-xs">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-zinc-300">{inv.customer_name ?? <span className="text-zinc-600 italic">Walk-in</span>}</td>
                    <td className="px-5 py-3 text-xs text-zinc-400">{new Date(inv.created_at).toLocaleString('en-LK')}</td>
                    <td className="px-5 py-3 text-center text-zinc-400">{inv.items.length}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-400">{fmt(inv.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-300">
                        {paymentLabels[inv.payment_method] ?? inv.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(inv)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - limit))}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              disabled={skip + limit >= total}
              onClick={() => setSkip(skip + limit)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selected && (
        <InvoiceReceipt
          invoice={selected}
          onClose={() => setSelected(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
};

