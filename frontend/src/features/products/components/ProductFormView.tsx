import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import type {
  BarcodeType,
  Brand,
  Category,
  Product,
  ProductCreateInput,
  ProductStatus,
  ProductType,
  ProductVariation,
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

const UNITS = [
  'Pieces',
  'Pairs',
  'Sets',
  'Bottles',
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

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [code, setCode] = useState(initialProduct?.code || generateAutoSku('General', 'TL'));
  const [barcode, setBarcode] = useState(initialProduct?.barcode || generateAutoBarcode());
  const [barcodeType, setBarcodeType] = useState(initialProduct?.barcode_type || 'CODE128');
  const [category, setCategory] = useState(initialProduct?.category || (categories[0]?.name ?? 'Braking System'));
  const [subcategory, setSubcategory] = useState(initialProduct?.subcategory || '');
  const [brand, setBrand] = useState(initialProduct?.brand || (brands[0]?.name ?? 'TorqueLine'));
  const [productType, setProductType] = useState<ProductType>(initialProduct?.product_type || 'standard');
  const [status, setStatus] = useState(initialProduct?.status || 'active');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || '');

  // Pricing
  const [costPrice, setCostPrice] = useState<number | ''>(initialProduct?.cost_price ?? 1200);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(initialProduct?.selling_price ?? 1750);
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>(initialProduct?.wholesale_price ?? '');
  const [minSellingPrice, setMinSellingPrice] = useState<number | ''>(initialProduct?.min_selling_price ?? '');
  const [defaultDiscount, setDefaultDiscount] = useState<number>(initialProduct?.default_discount ?? 0);
  const [taxRate, setTaxRate] = useState<number>(initialProduct?.tax_rate ?? 0);

  // Inventory
  const [quantity, setQuantity] = useState<number>(initialProduct?.quantity ?? 10);
  const [openingStock, setOpeningStock] = useState<number>(initialProduct?.opening_stock ?? 10);
  const [unit, setUnit] = useState(initialProduct?.unit || 'Pieces');
  const [minStockLevel, setMinStockLevel] = useState<number>(initialProduct?.min_stock_level ?? 5);
  const [reorderLevel, setReorderLevel] = useState<number>(initialProduct?.reorder_level ?? 10);
  const [warehouseLocation, setWarehouseLocation] = useState(initialProduct?.warehouse_location || 'Central Store Colombo');
  const [rackNumber, setRackNumber] = useState(initialProduct?.rack_number || 'R-01');
  const [shelfNumber, setShelfNumber] = useState(initialProduct?.shelf_number || 'S-01');
  const [stockTrackingEnabled, setStockTrackingEnabled] = useState(initialProduct?.stock_tracking_enabled ?? true);

  // Supplier
  const [supplierName, setSupplierName] = useState(initialProduct?.supplier_name || '');
  const [supplierCode, setSupplierCode] = useState(initialProduct?.supplier_code || '');
  const [supplierPrice, setSupplierPrice] = useState<number | ''>(initialProduct?.supplier_price ?? '');
  const [preferredSupplier, setPreferredSupplier] = useState(initialProduct?.preferred_supplier ?? false);
  const [deliveryDays, setDeliveryDays] = useState<number | ''>(initialProduct?.estimated_delivery_days ?? '');

  // Motorcycle Fitment & Additional Details
  const [compatibleModels, setCompatibleModels] = useState(initialProduct?.compatible_models || '');
  const [compatibleYears, setCompatibleYears] = useState(initialProduct?.compatible_years || '');
  const [warrantyPeriod, setWarrantyPeriod] = useState(initialProduct?.warranty_period || '');
  const [specifications, setSpecifications] = useState(initialProduct?.specifications || '');
  const [internalNotes, setInternalNotes] = useState(initialProduct?.internal_notes || '');
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured ?? false);

  // Variations (if productType === 'variants')
  const [variations, setVariations] = useState<ProductVariation[]>(() => {
    if (initialProduct?.variations_json) {
      try {
        return JSON.parse(initialProduct.variations_json);
      } catch {
        return [];
      }
    }
    return [];
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mark form as dirty when values change
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Calculations
  const cost = typeof costPrice === 'number' ? costPrice : 0;
  const retail = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const profitPerUnit = retail - cost;
  const profitMarginPct = cost > 0 ? (profitPerUnit / cost) * 100 : 0;
  const isBelowCost = retail > 0 && cost > 0 && retail < cost;
  const isBelowMin =
    typeof minSellingPrice === 'number' && minSellingPrice > 0 && retail > 0 && retail < minSellingPrice;

  const handleRegenerateSku = () => {
    setCode(generateAutoSku(category, brand));
    markDirty();
  };

  const handleRegenerateBarcode = () => {
    setBarcode(generateAutoBarcode());
    markDirty();
  };

  const handleAddVariation = () => {
    const newVar: ProductVariation = {
      id: Date.now().toString(),
      name: `${name} (Var ${variations.length + 1})`,
      attribute_name: 'Size',
      attribute_value: 'Standard',
      sku: `${code}-V${variations.length + 1}`,
      barcode: generateAutoBarcode(),
      cost_price: typeof costPrice === 'number' ? costPrice : 1000,
      selling_price: typeof sellingPrice === 'number' ? sellingPrice : 1500,
      quantity: 5,
      min_stock_level: 2,
      status: 'active',
    };
    setVariations((prev) => [...prev, newVar]);
    markDirty();
  };

  const handleRemoveVariation = (id: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
    markDirty();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!code.trim()) newErrors.code = 'SKU / Product code is required';
    if (!brand.trim()) newErrors.brand = 'Brand is required';
    if (!category.trim()) newErrors.category = 'Category is required';
    if (costPrice === '' || costPrice <= 0) newErrors.costPrice = 'Valid cost price (> 0) is required';
    if (sellingPrice === '' || sellingPrice <= 0) newErrors.sellingPrice = 'Valid selling price (> 0) is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: FormEvent, actionType: 'save' | 'save_and_add' | 'save_and_print') => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: ProductCreateInput = {
      name: name.trim(),
      code: code.trim(),
      barcode: barcode.trim() ? barcode.trim() : null,
      barcode_type: barcodeType as BarcodeType,
      category,
      subcategory: subcategory.trim() || null,
      brand,
      product_type: productType,
      status: status as ProductStatus,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      wholesale_price: wholesalePrice !== '' ? Number(wholesalePrice) : null,
      min_selling_price: minSellingPrice !== '' ? Number(minSellingPrice) : null,
      default_discount: Number(defaultDiscount) || 0,
      tax_rate: Number(taxRate) || 0,
      quantity: Number(quantity) || 0,
      opening_stock: Number(openingStock) || 0,
      unit,
      min_stock_level: Number(minStockLevel) || 5,
      reorder_level: Number(reorderLevel) || 10,
      warehouse_location: warehouseLocation.trim() || null,
      rack_number: rackNumber.trim() || null,
      shelf_number: shelfNumber.trim() || null,
      stock_tracking_enabled: stockTrackingEnabled,
      supplier_name: supplierName.trim() || null,
      supplier_code: supplierCode.trim() || null,
      supplier_price: supplierPrice !== '' ? Number(supplierPrice) : null,
      preferred_supplier: preferredSupplier,
      estimated_delivery_days: deliveryDays !== '' ? Number(deliveryDays) : null,
      compatible_models: compatibleModels.trim() || null,
      compatible_years: compatibleYears.trim() || null,
      warranty_period: warrantyPeriod.trim() || null,
      specifications: specifications.trim() || null,
      internal_notes: internalNotes.trim() || null,
      is_featured: isFeatured,
      variations_json: variations.length > 0 ? JSON.stringify(variations) : null,
    };

    await onSave(payload, actionType);
    setIsDirty(false);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292b31] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9a9ca6] mb-1.5">
            <button type="button" onClick={handleCancelClick} className="hover:text-white transition">
              Products
            </button>
            <span>/</span>
            <span className="text-[#f0442f] font-medium">{isEditing ? 'Edit Product' : 'Add New Product'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditing ? `Edit: ${initialProduct?.name}` : 'Create Motorcycle Spare Part'}
          </h1>
          <p className="text-xs sm:text-sm text-[#9a9ca6] mt-1">
            Complete the sections below to register this spare part, generate barcodes, and establish stock tracking.
          </p>
        </div>

        {/* Top Cancel / Back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-sm font-medium text-[#f3f4f6] hover:bg-[#292b31] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => handleFormSubmit(e, 'save')}
            className="px-6 py-2.5 rounded-xl bg-[#f0442f] text-sm font-semibold text-white shadow-lg shadow-red-950/40 hover:bg-[#ff5534] transition active:scale-95 disabled:opacity-50"
          >
            {isEditing ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="space-y-8">
        {/* SECTION A: BASIC INFORMATION */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              A
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Basic Information</h2>
              <p className="text-xs text-[#9a9ca6]">Product identity, classification, and visual media</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Product Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Product Name <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Brembo Sintered Front Brake Pads"
                className={`w-full bg-[#121316] border rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none ${
                  errors.name ? 'border-rose-500' : 'border-[#292b31] focus:border-[#f0442f]'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            {/* SKU with Auto-generate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#f3f4f6]">
                  SKU / Product Code <span className="text-[#f0442f]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSku}
                  className="text-xs font-medium text-[#f0442f] hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. BRM-BP-001"
                className={`w-full bg-[#121316] border font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none ${
                  errors.code ? 'border-rose-500' : 'border-[#292b31] focus:border-[#f0442f]'
                }`}
              />
              {errors.code && <p className="text-xs text-rose-400 mt-1">{errors.code}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Category <span className="text-[#f0442f]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Subcategory</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => {
                  setSubcategory(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Brake Pads, Rotors"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Brand <span className="text-[#f0442f]">*</span>
              </label>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Product Type</label>
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value as ProductType);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                <option value="standard">Standard Product</option>
                <option value="variants">Product with Variants (Sizes, Volumes)</option>
                <option value="service">Service / Labour</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Product Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ProductStatus);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                <option value="active">Active (Available for POS)</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Image URL with preview */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  markDirty();
                }}
                placeholder="https://... image link"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Product Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                placeholder="Enter technical specifications, friction grade, manufacturer notes..."
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: BARCODE MANAGEMENT */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              B
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Barcode Management</h2>
              <p className="text-xs text-[#9a9ca6]">Scannable barcode assignment, symbology, and real-time preview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#f3f4f6]">Barcode Value</label>
                  <button
                    type="button"
                    onClick={handleRegenerateBarcode}
                    className="text-xs font-medium text-[#f0442f] hover:underline"
                  >
                    Auto-Generate New Barcode
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    markDirty();
                  }}
                  placeholder="Enter or scan manufacturer barcode..."
                  className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Barcode Symbology</label>
                  <select
                    value={barcodeType}
                    onChange={(e) => {
                      setBarcodeType(e.target.value as BarcodeType);
                      markDirty();
                    }}
                    className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
                  >
                    <option value="CODE128">Code 128 (Universal)</option>
                    <option value="EAN13">EAN-13 (Retail Standard)</option>
                    <option value="UPCA">UPC-A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Quick Action</label>
                  <button
                    type="button"
                    onClick={() => {
                      setBarcode(code);
                      markDirty();
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#292b31] bg-[#22242b] text-xs font-medium text-[#f3f4f6] hover:bg-[#2b2d35] transition"
                  >
                    Use SKU as Barcode
                  </button>
                </div>
              </div>
            </div>

            {/* Real Barcode Preview Box */}
            <div className="p-5 rounded-2xl bg-[#121316] border border-[#292b31] flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase tracking-wider text-[#9a9ca6] mb-3 font-semibold">
                Real Scannable Barcode Label ({barcodeType})
              </span>
              {barcode && barcode.trim() ? (
                <div className="my-2 p-2 bg-[#17181c] rounded-xl border border-[#292b31] inline-block shadow-md">
                  <BarcodeBadge
                    value={barcode.trim()}
                    size="large"
                    showNumber={true}
                  />
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-xs text-[#6f727d]">
                  Enter barcode value to generate preview
                </div>
              )}
              <p className="text-[11px] text-[#9a9ca6] mt-3">
                Scannable by standard USB & wireless 1D/2D optical barcode scanners.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION C: PRICING INFORMATION */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              C
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Pricing & Margins</h2>
              <p className="text-xs text-[#9a9ca6]">Cost, retail, wholesale tiers, and margin preview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Cost Price (LKR / Rs.) <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  markDirty();
                }}
                className={`w-full bg-[#121316] border font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none ${
                  errors.costPrice ? 'border-rose-500' : 'border-[#292b31] focus:border-[#f0442f]'
                }`}
              />
              {errors.costPrice && <p className="text-xs text-rose-400 mt-1">{errors.costPrice}</p>}
            </div>

            {/* Retail Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Retail Selling Price (Rs.) <span className="text-[#f0442f]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  markDirty();
                }}
                className={`w-full bg-[#121316] border font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none ${
                  errors.sellingPrice ? 'border-rose-500' : 'border-[#292b31] focus:border-[#f0442f]'
                }`}
              />
              {errors.sellingPrice && <p className="text-xs text-rose-400 mt-1">{errors.sellingPrice}</p>}
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Wholesale Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={wholesalePrice}
                onChange={(e) => {
                  setWholesalePrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  markDirty();
                }}
                placeholder="Optional bulk tier"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Minimum Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Min Selling Price Floor (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minSellingPrice}
                onChange={(e) => {
                  setMinSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  markDirty();
                }}
                placeholder="Bottom price threshold"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Default Discount */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Default Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={defaultDiscount}
                onChange={(e) => {
                  setDefaultDiscount(parseFloat(e.target.value) || 0);
                  markDirty();
                }}
                placeholder="0"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Tax Rate / VAT (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(parseFloat(e.target.value) || 0);
                  markDirty();
                }}
                placeholder="0"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>
          </div>

          {/* Real-time Profit Preview Box */}
          <div className="mt-6 p-4 rounded-xl bg-[#121316] border border-[#292b31] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-[#9a9ca6] uppercase">Profit per Unit</span>
                <div
                  className={`text-lg font-bold font-mono ${
                    profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  Rs. {profitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#9a9ca6] uppercase">Profit Margin</span>
                <div
                  className={`text-lg font-bold font-mono ${
                    profitMarginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {profitMarginPct >= 0 ? '+' : ''}
                  {profitMarginPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Pricing Warnings */}
            {isBelowCost && (
              <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Warning: Selling price is below cost price!</span>
              </div>
            )}
            {isBelowMin && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Warning: Price is lower than minimum configured floor!</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION D: INVENTORY INFORMATION */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              D
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Inventory & Storage Location</h2>
              <p className="text-xs text-[#9a9ca6]">Opening stock, threshold triggers, and warehouse location</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Opening Stock / Available Stock */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Opening Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setQuantity(val);
                  setOpeningStock(val);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Stock */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Low Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => {
                  setMinStockLevel(parseInt(e.target.value, 10) || 0);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Reorder Level</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => {
                  setReorderLevel(parseInt(e.target.value, 10) || 0);
                  markDirty();
                }}
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Warehouse Location */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Warehouse / Branch</label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => {
                  setWarehouseLocation(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Central Store Colombo"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Rack Number */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Rack Number</label>
              <input
                type="text"
                value={rackNumber}
                onChange={(e) => {
                  setRackNumber(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. R-04"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Shelf Number */}
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Shelf Number</label>
              <input
                type="text"
                value={shelfNumber}
                onChange={(e) => {
                  setShelfNumber(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. S-02"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            {/* Tracking Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="stockTrackingToggle"
                checked={stockTrackingEnabled}
                onChange={(e) => {
                  setStockTrackingEnabled(e.target.checked);
                  markDirty();
                }}
                className="w-4 h-4 rounded text-[#f0442f] bg-[#121316] border-[#292b31] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="stockTrackingToggle" className="text-xs font-semibold text-[#f3f4f6] cursor-pointer">
                Enable Active Stock Movement Tracking
              </label>
            </div>
          </div>
        </div>

        {/* SECTION E: SUPPLIER INFORMATION */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              E
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Supplier Information</h2>
              <p className="text-xs text-[#9a9ca6]">Vendor details, supplier part reference, and delivery estimate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => {
                  setSupplierName(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Associated Motorways Ltd"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Supplier Product Code</label>
              <input
                type="text"
                value={supplierCode}
                onChange={(e) => {
                  setSupplierCode(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. SUP-YAM-88"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Supplier Contract Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={supplierPrice}
                onChange={(e) => {
                  setSupplierPrice(e.target.value === '' ? '' : parseFloat(e.target.value));
                  markDirty();
                }}
                placeholder="Contract price"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Est. Delivery Lead Time (Days)</label>
              <input
                type="number"
                min="0"
                value={deliveryDays}
                onChange={(e) => {
                  setDeliveryDays(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  markDirty();
                }}
                placeholder="e.g. 3"
                className="w-full bg-[#121316] border border-[#292b31] font-mono rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="preferredSupplierToggle"
                checked={preferredSupplier}
                onChange={(e) => {
                  setPreferredSupplier(e.target.checked);
                  markDirty();
                }}
                className="w-4 h-4 rounded text-[#f0442f] bg-[#121316] border-[#292b31] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="preferredSupplierToggle" className="text-xs font-semibold text-[#f3f4f6] cursor-pointer">
                Mark as Preferred Primary Supplier for this part
              </label>
            </div>
          </div>
        </div>

        {/* SECTION F: MOTORCYCLE FITMENT & ADDITIONAL DETAILS */}
        <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#292b31] pb-4 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
              F
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Motorcycle Fitment & Details</h2>
              <p className="text-xs text-[#9a9ca6]">Compatible bike models, years, warranty, and specifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compatible Models */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">
                Compatible Motorcycle Models <span className="text-[#f0442f]">(Searchable Attribute)</span>
              </label>
              <input
                type="text"
                value={compatibleModels}
                onChange={(e) => {
                  setCompatibleModels(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Honda Dio 110, Honda Activa, Yamaha R15 V3, KTM Duke 390"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
              />
              <p className="text-[11px] text-[#6f727d] mt-1">
                Enter comma-separated models so staff can search compatibility instantly during billing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Compatible Model Years</label>
              <input
                type="text"
                value={compatibleYears}
                onChange={(e) => {
                  setCompatibleYears(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. 2016-2024"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Warranty Period</label>
              <input
                type="text"
                value={warrantyPeriod}
                onChange={(e) => {
                  setWarrantyPeriod(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. 6 Months / 5,000 km"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Technical Specifications</label>
              <input
                type="text"
                value={specifications}
                onChange={(e) => {
                  setSpecifications(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Thread: 10mm, Reach: 19mm, 120 Links"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#f3f4f6] mb-2">Internal Staff Notes</label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  markDirty();
                }}
                placeholder="Private store notes (not visible on receipts)"
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl px-4 py-3 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isFeaturedToggle"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  markDirty();
                }}
                className="w-4 h-4 rounded text-[#f0442f] bg-[#121316] border-[#292b31] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="isFeaturedToggle" className="text-xs font-semibold text-[#f3f4f6] cursor-pointer">
                Mark as Featured / Fast-Moving Hero Product (Showcase on POS landing)
              </label>
            </div>
          </div>
        </div>

        {/* SECTION F: PRODUCT VARIATIONS (only if variants selected) */}
        {productType === 'variants' && (
          <div className="rounded-2xl border border-[#292b31] bg-[#17181c] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0442f]/10 text-[#f0442f] font-bold text-sm">
                  F
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Product Variations</h2>
                  <p className="text-xs text-[#9a9ca6]">Independent SKU, Barcode, Pricing, and Stock per variant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddVariation}
                className="px-3.5 py-2 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-semibold text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
              >
                + Add Variant
              </button>
            </div>

            {variations.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#292b31] rounded-xl text-xs text-[#9a9ca6]">
                No variations configured yet. Click "+ Add Variant" to configure sizes (e.g. 500ml, 1L) or lengths.
              </div>
            ) : (
              <div className="space-y-4">
                {variations.map((v, idx) => (
                  <div key={v.id} className="p-4 rounded-xl bg-[#121316] border border-[#292b31] grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                    <div>
                      <label className="text-[10px] text-[#9a9ca6]">Attribute (e.g. Size)</label>
                      <input
                        type="text"
                        value={v.attribute_value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, attribute_value: val } : item))
                          );
                          markDirty();
                        }}
                        className="w-full bg-[#17181c] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9a9ca6]">Variant SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                          );
                          markDirty();
                        }}
                        className="w-full bg-[#17181c] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9a9ca6]">Barcode</label>
                      <input
                        type="text"
                        value={v.barcode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, barcode: val } : item))
                          );
                          markDirty();
                        }}
                        className="w-full bg-[#17181c] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9a9ca6]">Cost (Rs.)</label>
                      <input
                        type="number"
                        value={v.cost_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setVariations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, cost_price: val } : item))
                          );
                          markDirty();
                        }}
                        className="w-full bg-[#17181c] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9a9ca6]">Retail (Rs.)</label>
                      <input
                        type="number"
                        value={v.selling_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setVariations((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, selling_price: val } : item))
                          );
                          markDirty();
                        }}
                        className="w-full bg-[#17181c] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3">
                      <div>
                        <label className="text-[10px] text-[#9a9ca6]">Stock</label>
                        <input
                          type="number"
                          value={v.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setVariations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                            );
                            markDirty();
                          }}
                          className="w-16 bg-[#17181c] border border-[#292b31] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(v.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-1"
                        title="Delete variant"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOTTOM FORM ACTIONS */}
        <div className="sticky bottom-0 z-30 -mx-6 -mb-6 p-4 sm:p-6 bg-[#17181c]/95 border-t border-[#292b31] backdrop-blur-md flex flex-wrap items-center justify-between gap-4 rounded-b-2xl shadow-2xl">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-5 py-3 rounded-xl border border-[#292b31] bg-[#22242b] text-sm font-medium text-[#f3f4f6] hover:bg-[#292b31] hover:text-white transition"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {!isEditing && (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => handleFormSubmit(e, 'save_and_add')}
                  className="px-5 py-3 rounded-xl border border-[#292b31] bg-[#1b1c22] text-sm font-semibold text-white hover:bg-[#292b31] transition disabled:opacity-50"
                >
                  Save & Add Another
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => handleFormSubmit(e, 'save_and_print')}
                  className="px-5 py-3 rounded-xl border border-[#f0442f]/40 bg-[#f0442f]/10 text-sm font-semibold text-[#f0442f] hover:bg-[#f0442f]/20 transition disabled:opacity-50"
                >
                  Save & Print Barcode
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="px-7 py-3 rounded-xl bg-[#f0442f] text-sm font-bold text-white shadow-xl shadow-red-950/40 hover:bg-[#ff5534] transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard Product Changes?"
        message="You have unsaved changes on this product form. Are you sure you want to leave without saving?"
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        isDestructive={true}
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsDirty(false);
          onCancel();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </div>
  );
};

