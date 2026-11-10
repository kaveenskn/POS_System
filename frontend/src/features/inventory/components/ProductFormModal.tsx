import { useEffect, useMemo, useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Product, ProductCreateInput } from '../../../types/product.types';
import { generateAutoBarcode, generateAutoSku } from '../../../utils/barcodeGenerator';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductCreateInput) => Promise<void>;
  product?: Product | null;
  categories: string[];
}

const DEFAULT_CATEGORIES = [
  'Braking System',
  'Oils & Lubricants',
  'Electrical & Ignition',
  'Drivetrain & Transmission',
  'Tyres & Wheels',
  'Scooter & Transmission',
  'Engine & Mechanical',
  'Body & Accessories',
];

export const ProductFormModal: FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Braking System');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('Pieces');
  const [minStockLevel, setMinStockLevel] = useState('5');
  const [warehouseLocation, setWarehouseLocation] = useState('Central Store Colombo');
  const [compatibleModels, setCompatibleModels] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCategories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...categories])).filter(Boolean),
    [categories]
  );

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCode(product.code || '');
      setBarcode(product.barcode || '');
      if (allCategories.includes(product.category)) {
        setCategory(product.category);
        setCustomCategory('');
      } else {
        setCategory('other');
        setCustomCategory(product.category || '');
      }
      setBrand(product.brand || '');
      setCostPrice(String(product.cost_price ?? ''));
      setSellingPrice(String(product.selling_price ?? ''));
      setWholesalePrice(product.wholesale_price ? String(product.wholesale_price) : '');
      setQuantity(String(product.quantity ?? 0));
      setUnit(product.unit || 'Pieces');
      setMinStockLevel(String(product.min_stock_level ?? 5));
      setWarehouseLocation(product.warehouse_location || 'Central Store Colombo');
      setCompatibleModels(product.compatible_models || '');
    } else {
      setName('');
      setCode(generateAutoSku('Braking System', 'TL'));
      setBarcode(generateAutoBarcode());
      setCategory('Braking System');
      setCustomCategory('');
      setBrand('');
      setCostPrice('');
      setSellingPrice('');
      setWholesalePrice('');
      setQuantity('10');
      setUnit('Pieces');
      setMinStockLevel('5');
      setWarehouseLocation('Central Store Colombo');
      setCompatibleModels('');
    }
    setError(null);
  }, [product, isOpen, allCategories]);

  if (!isOpen) return null;

  // Auto generate unique barcode
  const handleGenerateBarcode = () => {
    setBarcode(generateAutoBarcode());
  };

  // Auto generate code from name and brand
  const handleGenerateCode = () => {
    setCode(generateAutoSku(category, brand || 'TL'));
  };

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const profitMargin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }
    if (!trimmedCode) {
      setError('Product code / SKU is required.');
      return;
    }
    if (sell < 0 || cost < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    const finalCategory = category === 'other' ? (customCategory.trim() || 'General') : category;

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        code: trimmedCode,
        barcode: barcode.trim() || generateAutoBarcode(),
        barcode_type: 'CODE128',
        category: finalCategory,
        brand: brand.trim() || 'TorqueLine',
        cost_price: cost,
        selling_price: sell,
        wholesale_price: wholesalePrice ? parseFloat(wholesalePrice) : null,
        quantity: parseInt(quantity, 10) || 0,
        unit: unit.trim() || 'Pieces',
        min_stock_level: parseInt(minStockLevel, 10) || 0,
        warehouse_location: warehouseLocation.trim() || null,
        compatible_models: compatibleModels.trim() || null,
        product_type: 'standard',
        status: 'active',
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to save product details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#14161d] border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {product ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {product
                ? `Updating part: ${product.name} (${product.code})`
                : 'Enter product details, pricing, and initial stock'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Row 1: Product Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Product / Part Name <span className="text-[#eb4826]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brembo Sintered Front Brake Pads"
              className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          {/* Row 2: Code / SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Part Code / SKU <span className="text-[#eb4826]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[11px] text-[#eb4826] hover:underline"
                >
                  ⚡ Auto
                </button>
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BRM-BP-001"
                className="w-full font-mono uppercase bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Barcode (EAN / Code128)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-[#eb4826] hover:underline"
                >
                  ⚡ Generate
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          {/* Row 3: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="other">+ Other (Custom)</option>
              </select>
              {category === 'other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="mt-2 w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Brand / Manufacturer</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Brembo, Motul, NGK, DID"
                className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          {/* Row 4: Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cost Price (Rs.) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Retail Price (Rs.) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-semibold focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Wholesale Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                placeholder="Bulk rate"
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-semibold focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Retail Margin</label>
              <div className="px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm font-mono text-zinc-300">
                {profitMargin}%
                <span className="text-xs text-zinc-500 ml-1">
                  (Rs. {Math.max(0, sell - cost).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Stock & Reorder Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Current Stock <span className="text-[#eb4826]">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              >
                <option value="Pieces">Pieces (Pcs)</option>
                <option value="Sets">Sets</option>
                <option value="Pairs">Pairs</option>
                <option value="Bottles">Bottles</option>
                <option value="Litres">Litres</option>
                <option value="Meters">Meters</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Low Stock Alert At</label>
              <input
                type="number"
                min="1"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                placeholder="5"
                className="w-full font-mono bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          {/* Row 6: Location & Fitment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Shelf / Warehouse Location</label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="e.g. Central Store / Shelf B-04"
                className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Compatible Bike Models</label>
              <input
                type="text"
                value={compatibleModels}
                onChange={(e) => setCompatibleModels(e.target.value)}
                placeholder="e.g. Yamaha R15, KTM Duke 250, Honda Dio"
                className="w-full bg-[#0b0c10] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-sm font-semibold text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-sm font-bold text-white shadow-lg shadow-red-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : product ? 'Save Changes' : '+ Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
