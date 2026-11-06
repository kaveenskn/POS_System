import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type {
  Product,
  ProductActivity,
  ProductVariation,
  StockMovement,
} from '../../../types/product.types';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
  stockHistory: StockMovement[];
  activityHistory: ProductActivity[];
}

export const ProductDetailsModal: FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onAdjustStock,
  onPrintBarcode,
  stockHistory,
  activityHistory,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'pricing' | 'variations' | 'suppliers' | 'sales' | 'activity'
  >('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const profit = product.selling_price - product.cost_price;
  const marginPct = product.selling_price > 0 ? (profit / product.selling_price) * 100 : 0;
  const variations: ProductVariation[] = product.variations_json
    ? JSON.parse(product.variations_json)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#17181c] border border-[#292b31] p-6 sm:p-8 shadow-2xl text-left my-8 max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292b31] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#22242b] border border-[#292b31] overflow-hidden flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-[#6f727d]">{product.brand.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#f0442f] bg-[#f0442f]/10 px-2.5 py-0.5 rounded-md">
                  {product.code}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                    product.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-700/30 text-zinc-400'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">{product.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAdjustStock(product)}
              className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition flex items-center gap-1.5"
            >
              <span>📦</span>
              <span>Adjust Stock</span>
            </button>
            <button
              type="button"
              onClick={() => onPrintBarcode(product)}
              className="px-3 py-2 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-semibold text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
            >
              <span>🏷️</span>
              <span>Barcode</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="px-3 py-2 rounded-xl bg-[#f0442f] text-xs font-semibold text-white hover:bg-[#ff5534] transition flex items-center gap-1.5"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#22242b] border border-[#292b31] text-[#9a9ca6] hover:text-white flex items-center justify-center ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#292b31] py-3 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'inventory', label: 'Inventory & Movements' },
            { id: 'pricing', label: 'Pricing & Margin' },
            { id: 'variations', label: `Variations (${variations.length})` },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'sales', label: 'Sales History' },
            { id: 'activity', label: 'Activity Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | 'overview'
                    | 'inventory'
                    | 'pricing'
                    | 'variations'
                    | 'suppliers'
                    | 'sales'
                    | 'activity'
                )
              }
              className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#f0442f] text-white shadow-md'
                  : 'text-[#9a9ca6] hover:text-white hover:bg-[#22242b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="py-6 overflow-y-auto flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-[#9a9ca6] mb-2">Description</h3>
                  <p className="text-sm text-[#f3f4f6] leading-relaxed bg-[#121316] p-4 rounded-xl border border-[#292b31]">
                    {product.description || 'No description provided for this spare part.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                    <span className="text-xs text-[#9a9ca6]">Category / Subcategory</span>
                    <div className="text-sm font-semibold text-white mt-1">
                      {product.category} {product.subcategory && `/ ${product.subcategory}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                    <span className="text-xs text-[#9a9ca6]">Manufacturer Brand</span>
                    <div className="text-sm font-semibold text-white mt-1">{product.brand}</div>
                  </div>
                </div>

                {product.compatible_models && (
                  <div>
                    <h3 className="text-xs uppercase font-semibold tracking-wider text-[#9a9ca6] mb-2">
                      Compatible Motorcycle Models
                    </h3>
                    <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31] flex flex-wrap gap-2">
                      {product.compatible_models.split(',').map((model, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-[#22242b] text-xs font-medium text-white border border-[#292b31]"
                        >
                          🏍 {model.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar with scannable barcode & quick stock stat */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#121316] border border-[#292b31] text-center">
                  <span className="text-xs uppercase tracking-wider text-[#9a9ca6] mb-3 block font-semibold">
                    Barcode Symbology ({product.barcode_type})
                  </span>
                  <div className="flex justify-center my-3">
                    <BarcodeBadge
                      value={product.barcode || product.code}
                      size="medium"
                      showNumber={true}
                      onPrint={() => onPrintBarcode(product)}
                    />
                  </div>
                  <div className="text-[11px] text-[#9a9ca6]">
                    Click barcode label to print thermal sticker
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#121316] border border-[#292b31] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9a9ca6]">Available Stock:</span>
                    <strong className="text-white text-sm">
                      {product.quantity} {product.unit}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9a9ca6]">Warehouse Location:</span>
                    <span className="text-white">{product.warehouse_location || 'Central Store'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9a9ca6]">Bin / Rack / Shelf:</span>
                    <span className="text-white font-mono">
                      {product.rack_number || 'R-01'} / {product.shelf_number || 'S-01'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & MOVEMENTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Current Available</span>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {product.quantity} {product.unit}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Opening Stock</span>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {product.opening_stock} {product.unit}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Low Stock Trigger</span>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">
                    {product.min_stock_level} {product.unit}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Stock Valuation</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    Rs. {(product.quantity * product.cost_price).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase font-semibold tracking-wider text-[#9a9ca6] mb-3">
                  Historical Stock Movements ({stockHistory.length} logs)
                </h3>
                <div className="overflow-hidden rounded-xl border border-[#292b31] bg-[#121316]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#17181c] text-[#9a9ca6] border-b border-[#292b31]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Movement Type</th>
                        <th className="px-4 py-3 text-right">Adjustment</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292b31]/60">
                      {stockHistory.map((m) => (
                        <tr key={m.id} className="hover:bg-[#1b1c22]">
                          <td className="px-4 py-2.5 text-[#9a9ca6]">
                            {new Date(m.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="capitalize font-medium text-white">{m.movement_type.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">
                            <span className={m.adjustment_quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {m.adjustment_quantity >= 0 ? `+${m.adjustment_quantity}` : m.adjustment_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-white">
                            {m.new_quantity}
                          </td>
                          <td className="px-4 py-2.5 text-[#f3f4f6]">{m.reason}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">{m.user_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & MARGIN */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Cost Price</span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    Rs. {Number(product.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Retail Selling Price</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    Rs. {Number(product.selling_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Unit Profit</span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    Rs. {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31]">
                  <span className="text-xs text-[#9a9ca6]">Profit Margin</span>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    +{marginPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VARIATIONS */}
          {activeTab === 'variations' && (
            <div>
              {variations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9a9ca6] border border-dashed border-[#292b31] rounded-xl">
                  This product is currently configured as a standard standalone item with no variations.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#292b31] bg-[#121316]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#17181c] text-[#9a9ca6]">
                      <tr>
                        <th className="px-4 py-3">Variant</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Barcode</th>
                        <th className="px-4 py-3 text-right">Cost (Rs.)</th>
                        <th className="px-4 py-3 text-right">Retail (Rs.)</th>
                        <th className="px-4 py-3 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292b31]/60">
                      {variations.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-3 font-semibold text-white">{v.attribute_value}</td>
                          <td className="px-4 py-3 font-mono text-[#f0442f]">{v.sku}</td>
                          <td className="px-4 py-3">
                            <BarcodeBadge value={v.barcode} size="compact" showNumber={true} />
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{v.cost_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-white">
                            {v.selling_price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-400">{v.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31] space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#292b31]">
                <span className="text-[#9a9ca6]">Supplier Name:</span>
                <span className="font-semibold text-white">{product.supplier_name || 'Direct Wholesale'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#292b31]">
                <span className="text-[#9a9ca6]">Supplier Part Code:</span>
                <span className="font-mono text-white">{product.supplier_code || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#292b31]">
                <span className="text-[#9a9ca6]">Contract Purchase Price:</span>
                <span className="font-mono text-white">
                  Rs. {product.supplier_price ? Number(product.supplier_price).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9a9ca6]">Estimated Delivery Time:</span>
                <span className="text-white">{product.estimated_delivery_days ? `${product.estimated_delivery_days} days` : '2-3 days'}</span>
              </div>
            </div>
          )}

          {/* TAB 6: SALES HISTORY */}
          {activeTab === 'sales' && (
            <div className="overflow-hidden rounded-xl border border-[#292b31] bg-[#121316]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#17181c] text-[#9a9ca6]">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price (Rs.)</th>
                    <th className="px-4 py-3">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/60">
                  <tr>
                    <td className="px-4 py-3 font-mono text-[#f0442f]">INV-2026-1042</td>
                    <td className="px-4 py-3 text-[#9a9ca6]">Yesterday 15:32</td>
                    <td className="px-4 py-3 text-white">Kamal Perera (WP-CAD-8812)</td>
                    <td className="px-4 py-3 text-center font-bold text-white">2</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">
                      Rs. {Number(product.selling_price * 2).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[#9a9ca6]">Cashier #1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: ACTIVITY AUDIT */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activityHistory.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-[#121316] border border-[#292b31] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{act.action}</div>
                    <div className="text-[#9a9ca6] mt-0.5">{act.details}</div>
                  </div>
                  <div className="text-right text-[#6f727d]">
                    <div>{act.user_name}</div>
                    <div className="text-[10px]">{new Date(act.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
