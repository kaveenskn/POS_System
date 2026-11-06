import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Product, StockAdjustmentInput } from '../../../types/product.types';

interface StockAdjustmentModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: StockAdjustmentInput) => Promise<void>;
  isLoading?: boolean;
}

export const StockAdjustmentModal: FC<StockAdjustmentModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'damaged' | 'lost' | 'correction'>('increase');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Supplier restock delivery');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.quantity;
  let newStock = currentStock;

  if (adjustmentType === 'increase') {
    newStock = currentStock + (quantity || 0);
  } else if (['decrease', 'damaged', 'lost'].includes(adjustmentType)) {
    newStock = Math.max(0, currentStock - (quantity || 0));
  } else if (adjustmentType === 'correction') {
    newStock = Math.max(0, quantity || 0);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid adjustment reason is mandatory for audit records');
      return;
    }
    if (quantity < 0) {
      setError('Adjustment quantity cannot be negative');
      return;
    }

    try {
      await onConfirm({
        adjustment_type: adjustmentType,
        adjustment_quantity: quantity,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        user_name: 'Admin',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply stock adjustment';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#17181c] border border-[#292b31] p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
              📦
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Stock Adjustment</h3>
              <p className="text-xs text-[#9a9ca6]">Update available inventory and log audit movement</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#9a9ca6] hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly product name and SKU */}
          <div className="p-3.5 rounded-xl bg-[#121316] border border-[#292b31] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white line-clamp-1">{product.name}</div>
              <div className="text-[11px] font-mono text-[#f0442f]">{product.code}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#9a9ca6] uppercase">Current Stock</span>
              <div className="text-base font-mono font-bold text-white">
                {currentStock} {product.unit}
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">Adjustment Type</label>
            <select
              value={adjustmentType}
              onChange={(e) =>
                setAdjustmentType(
                  e.target.value as 'increase' | 'decrease' | 'damaged' | 'lost' | 'correction'
                )
              }
              className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3.5 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
            >
              <option value="increase">Stock Increase (+) (Purchase Arrival / Stock In)</option>
              <option value="decrease">Stock Decrease (-) (Internal Transfer / Return)</option>
              <option value="damaged">Damaged Stock (-) (Broken during handling)</option>
              <option value="lost">Lost Stock (-) (Missing in count)</option>
              <option value="correction">Inventory Audit Correction (Set exact count)</option>
            </select>
          </div>

          {/* Adjustment Quantity */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
              {adjustmentType === 'correction' ? 'New Exact Stock Count' : 'Quantity to Adjust'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-3.5 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
            />
          </div>

          {/* Real-time Calculation Summary Preview */}
          <div className="p-3.5 rounded-xl bg-[#22242b] border border-[#292b31] flex items-center justify-between">
            <span className="text-xs text-[#9a9ca6]">Resulting Stock Preview:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-[#9a9ca6]">{currentStock}</span>
              <span className="text-xs text-[#f0442f]">→</span>
              <span
                className={`text-base font-bold ${
                  newStock <= 0
                    ? 'text-rose-400'
                    : newStock <= product.min_stock_level
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {newStock} {product.unit}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
              Adjustment Reason <span className="text-[#f0442f]">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3.5 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] mb-2"
            >
              <option value="Supplier restock delivery">Supplier restock delivery</option>
              <option value="Physical count audit adjustment">Physical count audit adjustment</option>
              <option value="Damaged in workshop handling">Damaged in workshop handling</option>
              <option value="Customer exchange return">Customer exchange return</option>
              <option value="Supplier warranty return">Supplier warranty return</option>
              <option value="Found unaccounted inventory">Found unaccounted inventory</option>
              <option value="Other">Other (specify below)</option>
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom reason..."
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">Internal Audit Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. GRN-9982, verified by Storekeeper..."
              className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#292b31] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#22242b] text-sm text-[#f3f4f6] hover:bg-[#292b31]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-bold text-black shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

