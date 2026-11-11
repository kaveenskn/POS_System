import type { FC } from 'react';
import type { InvoiceResponse } from '../../../types/invoice.types';

interface InvoiceReceiptProps {
  invoice: InvoiceResponse;
  onClose: () => void;
  onPrint: () => void;
}

const fmt = (n: number) =>
  'Rs. ' + Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 });

export const InvoiceReceipt: FC<InvoiceReceiptProps> = ({ invoice, onClose, onPrint }) => {
  const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Invoice Receipt"
    >
      <div className="relative w-full max-w-md bg-[#14161d] border border-zinc-700 rounded-2xl shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="bg-[#eb4826] px-6 py-5 text-center">
          <div className="text-2xl font-black tracking-tight">TorqueLine Moto Parts</div>
          <div className="text-xs text-red-200 mt-0.5">Official Invoice / Receipt</div>
        </div>

        {/* Receipt Body (printable) */}
        <div id="receipt-body" className="px-6 py-4 space-y-3 text-sm">
          {/* Invoice meta */}
          <div className="flex justify-between text-zinc-400 text-xs border-b border-zinc-700 pb-2">
            <span>Invoice#</span>
            <span className="font-mono font-bold text-white">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between text-zinc-400 text-xs">
            <span>Date</span>
            <span className="text-white">
              {new Date(invoice.created_at).toLocaleString('en-LK')}
            </span>
          </div>
          {invoice.customer_name && (
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>Customer</span>
              <span className="text-white">{invoice.customer_name}</span>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-dashed border-zinc-700 pt-3 mt-2">
            <div className="grid grid-cols-12 text-xs font-semibold text-zinc-400 mb-1">
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-3 text-right">Total</span>
            </div>
            {invoice.items.map((item) => {
              const gross = Number(item.unit_price) * item.quantity;
              const disc = Number(item.discount_amount || 0);
              return (
                <div key={item.id} className="grid grid-cols-12 text-xs py-1.5 border-b border-zinc-800">
                  <div className="col-span-5">
                    <div className="text-white truncate font-medium">{item.product_name}</div>
                    <div className="text-zinc-500 font-mono text-[11px]">{item.product_code}</div>
                    {disc > 0 && (
                      <div className="text-emerald-400 text-[10px]">
                        Save: -{fmt(disc)}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-zinc-300">{item.quantity}</div>
                  <div className="col-span-2 text-right text-zinc-300">
                    {Number(item.unit_price).toFixed(2)}
                  </div>
                  <div className="col-span-3 text-right">
                    {disc > 0 && (
                      <div className="line-through text-zinc-500 text-[10px]">
                        {gross.toFixed(2)}
                      </div>
                    )}
                    <span className="text-white font-semibold">
                      {Number(item.line_total).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Total Discount</span>
                <span className="font-mono">- {fmt(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white border-t border-zinc-700 pt-2 mt-1">
              <span>FINAL TOTAL</span>
              <span className="text-[#eb4826] font-mono">{fmt(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Amount Received ({paymentLabels[invoice.payment_method] || invoice.payment_method})</span>
              <span className="font-mono">{fmt(invoice.amount_paid)}</span>
            </div>
            {invoice.change_amount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                <span>Change to Return</span>
                <span className="font-mono">{fmt(invoice.change_amount)}</span>
              </div>
            )}
            {invoice.amount_paid < invoice.total_amount && (
              <div className="flex justify-between text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">
                <span>Remaining Balance</span>
                <span className="font-mono">{fmt(invoice.total_amount - invoice.amount_paid)}</span>
              </div>
            )}
          </div>

          {invoice.notes && (
            <div className="text-xs text-zinc-500 border-t border-zinc-700 pt-2 mt-2">
              Note: {invoice.notes}
            </div>
          )}

          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-dashed border-zinc-700">
            Thank you for your purchase!
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5 pt-2">
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-white transition"
          >
            🖨 Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

