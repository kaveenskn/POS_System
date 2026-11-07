import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Product, StockAdjustmentInput } from '../../../types/product.types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjust: (productId: number, data: StockAdjustmentInput) => Promise<void>;
}

export const StockAdjustmentModal: FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjust,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState('5');
  const [reason, setReason] = useState('Supplier restock arrival');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentQty = product.quantity;
  const adjQty = parseInt(quantity, 10) || 0;
  const newQty = adjustmentType === 'increase' ? currentQty + adjQty : Math.max(0, currentQty - adjQty);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (adjQty <= 0) {
      setError('Please enter a quantity greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdjust(product.id, {
        adjustment_type: adjustmentType,
        adjustment_quantity: adjQty,
        reason: reason.trim() || 'Manual stock adjustment',
        user_name: 'Admin',
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#14161d] border border-zinc-800 rounded-3xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white">Adjust Stock Level</h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[280px]">
              {product.name} ({product.code})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Current vs New preview */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Current Stock</span>
              <span className="font-mono text-base font-bold text-zinc-300">
                {currentQty} {product.unit}
              </span>
            </div>
            <div className="text-zinc-600 text-xl font-bold">➔</div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 block">New Stock</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {newQty} {product.unit}
              </span>
            </div>
          </div>

          {/* Type: Increase vs Decrease */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('increase');
                  setReason('Supplier restock arrival');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  adjustmentType === 'increase'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-md'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                + Add Stock (Restock)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('decrease');
                  setReason('Damaged or discarded item');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                  adjustmentType === 'decrease'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-md'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                − Deduct Stock
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Adjustment Quantity
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full font-mono text-center text-lg font-bold bg-[#0b0c10] border border-zinc-700 rounded-xl py-2.5 text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Reason / Note</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Shipment arrival, stocktake count..."
              className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-xs font-bold text-white shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

