import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import type {
  BarcodeType,
  Brand,
  Category,
  Product,
  ProductCreateInput,
} from '../../../types/product.types';
import {
  generateAutoBarcode,
  generateAutoSku,
} from '../../../utils/barcodeGenerator';
import { ConfirmDialog } from './ConfirmDialog';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductFormViewProps {
  initialProduct?: Product | null;
  categories: Category[];
  brands: Brand[];
  onSave: (data: ProductCreateInput, actionType: 'save' | 'save_and_add' | 'save_and_print') => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COMMON_UNITS = [
  'Pieces',
  'Bottles',
  'Sets',
  'Pairs',
  'Boxes',
  'Litres',
  'Kilograms',
  'Metres',
  'Packs',
];

export const ProductFormView: FC<ProductFormViewProps> = ({
  initialProduct,
  categories,
  brands,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialProduct);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SECTION 1: Product Information
  const [name, setName] = useState(initialProduct?.name || '');
  const [code, setCode] = useState(initialProduct?.code || generateAutoSku('General', 'TL'));
  const [category, setCategory] = useState(
    initialProduct?.category || (categories[0]?.name ?? 'Braking System')
  );
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || '');
  const [description, setDescription] = useState(initialProduct?.description || '');

  // SECTION 2: Barcode Management
  const [barcode, setBarcode] = useState(initialProduct?.barcode || generateAutoBarcode());
  const [barcodeType] = useState<BarcodeType>(initialProduct?.barcode_type || 'CODE128');
  const [isScannerActive, setIsScannerActive] = useState(false);

  // SECTION 3: Pricing
  const [costPrice, setCostPrice] = useState<number | ''>(initialProduct?.cost_price ?? '');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(initialProduct?.selling_price ?? '');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>(initialProduct?.wholesale_price ?? '');

  // SECTION 4: Stock Information
  const [openingStock, setOpeningStock] = useState<number | ''>(initialProduct?.opening_stock ?? 0);
  const [unit, setUnit] = useState(initialProduct?.unit || 'Pieces');
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(
    initialProduct?.min_stock_level ?? 5
  );
  const [storageLocation, setStorageLocation] = useState(
    initialProduct?.warehouse_location || initialProduct?.rack_number || ''
  );

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showBarcodeChangeDialog, setShowBarcodeChangeDialog] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<'save' | 'save_and_add' | 'save_and_print'>('save');

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Profit Calculations (as specified: Profit Margin = (Profit / Selling Price) * 100)
  const cost = typeof costPrice === 'number' ? costPrice : 0;
  const retail = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const wholesale = typeof wholesalePrice === 'number' ? wholesalePrice : null;
  const profitPerUnit = retail > 0 && cost > 0 ? retail - cost : 0;
  const profitMarginPct = retail > 0 && cost > 0 ? (profitPerUnit / retail) * 100 : 0;
  const isLoss = retail > 0 && cost > 0 && retail < cost;

  // SKU Regeneration
  const handleRegenerateSku = () => {
    const newSku = generateAutoSku(category, brand || 'TL');
    setCode(newSku);
    markDirty();
  };

  // Barcode Auto-Generation
  const handleRegenerateBarcode = () => {
    const newBarcode = generateAutoBarcode();
    setBarcode(newBarcode);
    markDirty();
  };

  // Focus Barcode field for USB scanner input
  const handleActivateScanner = () => {
    setIsScannerActive(true);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
      barcodeInputRef.current.select();
    }
  };

  // Image Upload / Preview handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size exceeds 2MB limit' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          markDirty();
          setErrors((prev) => {
            const next = { ...prev };
            delete next.image;
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Product name is required';
    }

    if (!code.trim()) {
      errs.code = 'SKU is required';
    }

    if (!category.trim()) {
      errs.category = 'Category selection is required';
    }

    if (costPrice === '' || costPrice === null || Number(costPrice) <= 0) {
      errs.costPrice = 'Valid purchase cost price is required (greater than 0)';
    }

    if (sellingPrice === '' || sellingPrice === null || Number(sellingPrice) <= 0) {
      errs.sellingPrice = 'Valid retail selling price is required (greater than 0)';
    }

    if (wholesalePrice !== '' && wholesalePrice !== null && Number(wholesalePrice) <= 0) {
      errs.wholesalePrice = 'Wholesale price must be greater than 0 if specified';
    }

    if (openingStock === '' || openingStock === null || Number(openingStock) < 0) {
      errs.openingStock = 'Opening stock is required (0 or greater)';
    }

    if (!unit.trim()) {
      errs.unit = 'Unit of measurement is required';
    }

    if (barcode && barcode.trim().length < 3) {
      errs.barcode = 'Barcode must be at least 3 characters if provided';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (
    e: FormEvent,
    actionType: 'save' | 'save_and_add' | 'save_and_print'
  ) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check if barcode changed on an existing product (Safety Check)
    if (
      isEditing &&
      initialProduct?.barcode &&
      barcode.trim() !== initialProduct.barcode.trim()
    ) {
      setPendingActionType(actionType);
      setShowBarcodeChangeDialog(true);
      return;
    }

    await executeSave(actionType);
  };

  const executeSave = async (actionType: 'save' | 'save_and_add' | 'save_and_print') => {
    const cleanQty = openingStock === '' ? 0 : Number(openingStock);
    const cleanMinStock = lowStockAlert === '' ? 5 : Number(lowStockAlert);

    const payload: ProductCreateInput = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      barcode: barcode.trim() || null,
      barcode_type: barcodeType,
      category: category.trim(),
      brand: brand.trim() || 'Unbranded',
      product_type: initialProduct?.product_type || 'standard',
      status: initialProduct?.status || 'active',
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      wholesale_price: wholesale !== null && wholesale > 0 ? wholesale : null,
      quantity: cleanQty,
      opening_stock: cleanQty,
      unit: unit.trim(),
      min_stock_level: cleanMinStock,
      reorder_level: cleanMinStock,
      warehouse_location: storageLocation.trim() || null,
      rack_number: storageLocation.trim() || null,
      stock_tracking_enabled: true,
      preferred_supplier: initialProduct?.preferred_supplier ?? false,
      is_featured: initialProduct?.is_featured ?? false,
      // Preserve existing advanced attributes if editing
      compatible_models: initialProduct?.compatible_models || null,
      variations_json: initialProduct?.variations_json || null,
      supplier_name: initialProduct?.supplier_name || null,
      supplier_code: initialProduct?.supplier_code || null,
      supplier_price: initialProduct?.supplier_price || null,
    };

    await onSave(payload, actionType);
    setIsDirty(false);

    if (actionType === 'save_and_add') {
      // Reset form for next item while keeping same category/brand
      setName('');
      setCode(generateAutoSku(category, brand || 'TL'));
      setBarcode(generateAutoBarcode());
      setCostPrice('');
      setSellingPrice('');
      setWholesalePrice('');
      setOpeningStock(0);
      setImageUrl('');
      setDescription('');
      setErrors({});
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292b31] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9a9ca6] mb-1">
            <button
              type="button"
              onClick={handleCancelClick}
              className="hover:text-white transition"
            >
              Products
            </button>
            <span>/</span>
            <span className="text-[#f0442f] font-medium">
              {isEditing ? 'Edit Spare Part' : 'Add New Spare Part'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isEditing ? `Edit: ${initialProduct?.name}` : 'Add Product'}
          </h1>
          <p className="text-xs text-[#9a9ca6] mt-0.5">
            Quick 4-step product registration for motorcycle parts and inventory.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs font-semibold text-[#f3f4f6] hover:bg-[#292b31] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => handleFormSubmit(e, 'save')}
            className="px-5 py-2.5 rounded-xl bg-[#f0442f] text-xs font-semibold text-white shadow-lg shadow-red-950/40 hover:bg-[#ff5534] transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <span>💾</span>
                <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: PRODUCT INFORMATION */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0442f]/10 text-[#f0442f] font-bold text-xs">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Product Information
              </h2>
              <p className="text-xs text-[#9a9ca6]">
                Core identity of the motorcycle spare part
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Product Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Product Name <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markDirty();
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Brembo Sintered Front Brake Pads, Motul 7100 4T 10W-40 1L..."
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f] ${
                  errors.name ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              />
              {errors.name && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            {/* 2. SKU / Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#f3f4f6]">
                  SKU / Product Code <span className="text-[#f0442f]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSku}
                  className="text-[11px] text-[#f0442f] hover:underline font-medium"
                >
                  ↻ Auto-generate
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  markDirty();
                  if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
                }}
                placeholder="e.g. BRM-BP-001"
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 text-sm font-mono text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                  errors.code ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              />
              {errors.code && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.code}</p>
              )}
            </div>

            {/* 3. Category */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Category <span className="text-[#f0442f]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                  errors.category ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.category}</p>
              )}
            </div>

            {/* 4. Brand */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Brand <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                <option value="">Unbranded / Generic</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Product Image */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Product Image <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative w-11 h-11 rounded-xl bg-[#22242b] border border-[#292b31] overflow-hidden flex-shrink-0 group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        markDirty();
                      }}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#121316] border border-[#292b31] border-dashed flex items-center justify-center text-xs text-[#6f727d] flex-shrink-0">
                    📷
                  </div>
                )}
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      markDirty();
                    }}
                    placeholder="Paste image link or upload file..."
                    className="flex-1 bg-[#121316] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-medium text-[#f3f4f6] hover:bg-[#2b2d35] transition"
                  >
                    Browse
                  </button>
                </div>
              </div>
              {errors.image && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.image}</p>
              )}
            </div>

            {/* 6. Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Description <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                placeholder="Short technical description or notes..."
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: BARCODE */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0442f]/10 text-[#f0442f] font-bold text-xs">
              2
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Barcode Management
              </h2>
              <p className="text-xs text-[#9a9ca6]">
                Code 128 symbology, scanner compatibility, and real scannable preview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#f3f4f6]">
                    Barcode Value <span className="text-[#9a9ca6] font-normal">(Code 128)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="text-[11px] text-[#f0442f] hover:underline font-medium"
                  >
                    ↻ Generate New Barcode
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => {
                      setBarcode(e.target.value);
                      markDirty();
                      if (errors.barcode) setErrors((prev) => ({ ...prev, barcode: '' }));
                    }}
                    onBlur={() => setIsScannerActive(false)}
                    placeholder="Enter or scan manufacturer barcode..."
                    className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                      isScannerActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[#292b31]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleActivateScanner}
                    title="Click then scan with USB barcode scanner"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#22242b] border border-[#292b31] text-[11px] font-semibold text-white hover:bg-[#2b2d35]"
                  >
                    {isScannerActive ? 'Listening...' : '📷 Scan'}
                  </button>
                </div>
                {errors.barcode && (
                  <p className="text-rose-400 text-xs mt-1 font-medium">{errors.barcode}</p>
                )}
                <p className="text-[11px] text-[#6f727d] mt-1.5">
                  Compatible with standard USB and wireless handheld barcode scanners.
                </p>
              </div>

              {/* Quick shortcut to match SKU */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBarcode(code.trim());
                    markDirty();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#22242b] border border-[#292b31] text-xs text-[#9a9ca6] hover:text-white transition"
                >
                  Use SKU as Barcode Value
                </button>
              </div>
            </div>

            {/* Real Barcode Preview Card */}
            <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31] flex flex-col items-center justify-center text-center">
              <span className="text-[11px] uppercase tracking-wider text-[#9a9ca6] mb-2 font-semibold">
                Real Scannable Barcode Preview
              </span>
              {barcode && barcode.trim() ? (
                <div className="my-1">
                  <BarcodeBadge
                    value={barcode.trim()}
                    size="medium"
                    showNumber={true}
                  />
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-[#6f727d]">
                  Enter barcode value to generate preview
                </div>
              )}
              <span className="text-[10px] text-[#6f727d] mt-2">
                Prints on 50×30mm thermal rolls and standard label sheets
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: PRICING */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0442f]/10 text-[#f0442f] font-bold text-xs">
              3
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pricing & Profit Margin
              </h2>
              <p className="text-xs text-[#9a9ca6]">
                Automated profit and margin calculation per unit
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Cost Price (Rs.) <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setCostPrice(val);
                  markDirty();
                  if (errors.costPrice) setErrors((prev) => ({ ...prev, costPrice: '' }));
                }}
                placeholder="0.00"
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                  errors.costPrice ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              />
              {errors.costPrice && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.costPrice}</p>
              )}
            </div>

            {/* 2. Retail Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Selling Price (Rs.) <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setSellingPrice(val);
                  markDirty();
                  if (errors.sellingPrice) setErrors((prev) => ({ ...prev, sellingPrice: '' }));
                }}
                placeholder="0.00"
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                  errors.sellingPrice ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              />
              {errors.sellingPrice && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.sellingPrice}</p>
              )}
            </div>

            {/* 3. Wholesale Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Wholesale Price (Rs.) <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={wholesalePrice}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setWholesalePrice(val);
                  markDirty();
                }}
                placeholder="0.00"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>
          </div>

          {/* Automatic Profit & Margin Preview Bar */}
          <div className="mt-5 p-4 rounded-xl bg-[#121316] border border-[#292b31] grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-[#9a9ca6] block">Profit per Unit</span>
              <strong
                className={`text-base font-mono font-bold ${
                  isLoss ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                Rs. {profitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-[#9a9ca6] block">Profit Margin</span>
              <strong
                className={`text-base font-mono font-bold ${
                  isLoss ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {retail > 0 ? `${profitMarginPct.toFixed(1)}%` : '0.0%'}
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center">
              {isLoss ? (
                <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  ⚠️ Selling below cost price
                </span>
              ) : retail > 0 && cost > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  ✓ Healthy profit margin
                </span>
              ) : (
                <span className="text-xs text-[#6f727d]">
                  Enter cost and selling prices to preview margins
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: STOCK INFORMATION */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0442f]/10 text-[#f0442f] font-bold text-xs">
              4
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Stock Information
              </h2>
              <p className="text-xs text-[#9a9ca6]">
                Inventory tracking, unit type, threshold alerts, and bin storage
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {/* 1. Opening Stock */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Opening Stock <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={openingStock}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setOpeningStock(val);
                  markDirty();
                  if (errors.openingStock) setErrors((prev) => ({ ...prev, openingStock: '' }));
                }}
                placeholder="0"
                className={`w-full bg-[#121316] border rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f] ${
                  errors.openingStock ? 'border-rose-500' : 'border-[#292b31]'
                }`}
              />
              {errors.openingStock && (
                <p className="text-rose-400 text-xs mt-1 font-medium">{errors.openingStock}</p>
              )}
            </div>

            {/* 2. Unit */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Unit of Measure <span className="text-[#f0442f]">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Low Stock Alert */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Low Stock Alert <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={lowStockAlert}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setLowStockAlert(val);
                  markDirty();
                }}
                placeholder="e.g. 5"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 font-mono text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
              <span className="text-[10px] text-[#6f727d] mt-1 block">
                Triggers warning status badge
              </span>
            </div>

            {/* 4. Storage Location */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">
                Storage Location <span className="text-[#9a9ca6] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => {
                  setStorageLocation(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Shelf A1 or Rack B2"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
              <span className="text-[10px] text-[#6f727d] mt-1 block">
                Warehouse rack, bin, or shelf
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ACTION BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#292b31]">
          <button
            type="button"
            onClick={handleCancelClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#292b31] bg-[#17181c] text-xs font-semibold text-[#f3f4f6] hover:bg-[#22242b] transition"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!isEditing && (
              <button
                type="button"
                disabled={isLoading}
                onClick={(e) => handleFormSubmit(e, 'save_and_add')}
                className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs font-semibold text-white hover:bg-[#292b31] transition active:scale-95 disabled:opacity-50"
              >
                Save & Add Another
              </button>
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => handleFormSubmit(e, 'save_and_print')}
              className="px-4 py-2.5 rounded-xl border border-[#f0442f]/30 bg-[#f0442f]/10 text-xs font-semibold text-[#f0442f] hover:bg-[#f0442f]/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>🏷️</span>
              <span>Save & Print Barcode</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => handleFormSubmit(e, 'save')}
              className="px-6 py-2.5 rounded-xl bg-[#f0442f] text-xs font-semibold text-white shadow-lg shadow-red-950/40 hover:bg-[#ff5534] transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>✓</span>
                  <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Discard Changes Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. Are you sure you want to discard your changes and leave?"
        confirmLabel="Discard & Leave"
        cancelLabel="Continue Editing"
        isDestructive={true}
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsDirty(false);
          onCancel();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* Barcode Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBarcodeChangeDialog}
        title="Change Existing Barcode?"
        message={`This product is currently assigned barcode "${initialProduct?.barcode}". Changing it to "${barcode.trim()}" may invalidate existing printed product labels in your store. Are you sure you want to proceed?`}
        confirmLabel="Update Barcode"
        cancelLabel="Keep Original"
        isDestructive={false}
        onConfirm={async () => {
          setShowBarcodeChangeDialog(false);
          await executeSave(pendingActionType);
        }}
        onCancel={() => {
          setShowBarcodeChangeDialog(false);
          if (initialProduct?.barcode) {
            setBarcode(initialProduct.barcode);
          }
        }}
      />
    </div>
  );
};
