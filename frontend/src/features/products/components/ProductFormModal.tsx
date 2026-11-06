import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { ProductCreateInput } from '../../../types/product.types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductCreateInput) => Promise<void>;
  isLoading?: boolean;
}

export const ProductFormModal: FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    const qty = parseInt(quantity, 10);

    if (isNaN(cost) || cost <= 0) {
      setErrorMessage('Cost price must be greater than 0');
      return;
    }
    if (isNaN(selling) || selling <= 0) {
      setErrorMessage('Selling price must be greater than 0');
      return;
    }
    if (selling < cost) {
      setErrorMessage('Selling price is lower than cost price (Warning: Negative margin)');
    }

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        brand: brand.trim(),
        cost_price: cost,
        selling_price: selling,
        description: description.trim() ? description.trim() : undefined,
        quantity: isNaN(qty) ? 0 : Math.max(0, qty),
      });
      // Reset form
      setName('');
      setCode('');
      setBrand('');
      setCostPrice('');
      setSellingPrice('');
      setDescription('');
      setQuantity('0');
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(
        error?.response?.data?.detail || 'Failed to add product. Please check the details.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#14161d] border border-zinc-800 p-6 sm:p-8 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#eb4826]/10 text-[#eb4826] border border-[#eb4826]/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold">Add New Product</h2>
              <p className="text-xs text-zinc-400">Inventory item specification for POS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div>
              <label htmlFor="prod-name" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Product Name <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Front Disc Brake Pad Set"
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>

            {/* Product Code */}
            <div>
              <label htmlFor="prod-code" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Product Code / SKU <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="prod-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BRK-PAD-042"
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white uppercase placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="prod-brand" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Brand / Manufacturer <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="prod-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Brembo, Motul, NGK"
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>

            {/* Initial Stock Quantity */}
            <div>
              <label htmlFor="prod-qty" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Initial Stock Quantity
              </label>
              <input
                id="prod-qty"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label htmlFor="prod-cost" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Cost Price (Rs.) <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="prod-selling" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Selling Price (Rs.) <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="prod-selling"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Description <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, compatibility, placement..."
              className="w-full rounded-xl bg-[#0b0c10] border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#eb4826] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-white shadow-lg shadow-red-600/30 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

