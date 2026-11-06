import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { Product } from '../../../types/product.types';
import { generateCode128Svg } from '../../../utils/barcodeGenerator';

interface BarcodePrintModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodePrintModal: FC<BarcodePrintModalProps> = ({
  products,
  isOpen,
  onClose,
}) => {
  const [showName, setShowName] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [copies, setCopies] = useState(1);
  const [labelSize, setLabelSize] = useState<'thermal_50x30' | 'thermal_40x25' | 'a4_sheet'>('thermal_50x30');
  const [labelsPerRow, setLabelsPerRow] = useState(2);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || products.length === 0) return null;

  const targetProduct = products[0];
  const barcodeValue = targetProduct.barcode || targetProduct.code;

  // Single label barcode SVG
  const singleBarcodeSvg = generateCode128Svg(barcodeValue, {
    barWidth: 2,
    barHeight: 46,
    showText: true,
    fontSize: 12,
    color: '#000000',
    bgColor: '#ffffff',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([singleBarcodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode_${targetProduct.code}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#17181c] border border-[#292b31] p-6 shadow-2xl text-left my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#f0442f]/10 text-[#f0442f] flex items-center justify-center text-lg">
              🏷️
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Print Barcode Labels</h3>
              <p className="text-xs text-[#9a9ca6]">
                Configure thermal or standard label sheets for {products.length} product(s)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#9a9ca6] hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-[#121316] border border-[#292b31]">
          {/* Label Dimensions */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">Label Sheet Preset</label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as 'thermal_50x30' | 'thermal_40x25' | 'a4_sheet')}
              className="w-full bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
            >
              <option value="thermal_50x30">Thermal 50mm x 30mm (Standard)</option>
              <option value="thermal_40x25">Thermal 40mm x 25mm (Compact)</option>
              <option value="a4_sheet">A4 Sheet (Multi-column)</option>
            </select>
          </div>

          {/* Number of Copies */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">Number of Copies</label>
            <input
              type="number"
              min="1"
              max="100"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-[#17181c] border border-[#292b31] font-mono rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
            />
          </div>

          {/* Labels per row */}
          <div>
            <label className="block text-xs font-semibold text-[#f3f4f6] mb-1.5">Labels per Row</label>
            <select
              value={labelsPerRow}
              onChange={(e) => setLabelsPerRow(parseInt(e.target.value, 10))}
              className="w-full bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
            >
              <option value={1}>1 Column (Continuous Roll)</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns (Standard Sheet)</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="sm:col-span-3 flex flex-wrap items-center gap-6 pt-2 border-t border-[#292b31]/60">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showName}
                onChange={(e) => setShowName(e.target.checked)}
                className="rounded text-[#f0442f] bg-[#17181c] border-[#292b31]"
              />
              <span>Include Product Name</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showSku}
                onChange={(e) => setShowSku(e.target.checked)}
                className="rounded text-[#f0442f] bg-[#17181c] border-[#292b31]"
              />
              <span>Include SKU Code</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded text-[#f0442f] bg-[#17181c] border-[#292b31]"
              />
              <span>Include Selling Price (Rs.)</span>
            </label>
          </div>
        </div>

        {/* Live Printable Preview Area (Print-Ready Container) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9a9ca6] uppercase">Print Preview</span>
            <span className="text-xs text-[#6f727d]">
              Rendering {copies * products.length} total label(s)
            </span>
          </div>

          <div className="p-6 rounded-xl bg-white text-black border border-zinc-300 max-h-[300px] overflow-y-auto shadow-inner">
            <div
              className={`grid gap-4`}
              style={{
                gridTemplateColumns: `repeat(${labelsPerRow}, minmax(0, 1fr))`,
              }}
              id="printable-barcode-sheet"
            >
              {products.flatMap((prod) =>
                Array.from({ length: copies }).map((_, cIdx) => (
                  <div
                    key={`${prod.id}-${cIdx}`}
                    className="border border-dashed border-zinc-400 p-2.5 rounded-lg flex flex-col items-center justify-center text-center bg-white"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                      TorqueLine Moto Parts
                    </div>

                    {showName && (
                      <div className="text-xs font-extrabold text-black line-clamp-1 mt-0.5 max-w-[200px]">
                        {prod.name}
                      </div>
                    )}

                    {/* Barcode SVG */}
                    <div
                      className="my-1.5"
                      dangerouslySetInnerHTML={{
                        __html: generateCode128Svg(prod.barcode || prod.code, {
                          barWidth: 1.8,
                          barHeight: 38,
                          showText: true,
                          fontSize: 10,
                          color: '#000000',
                          bgColor: '#ffffff',
                        }),
                      }}
                    />

                    <div className="flex items-center justify-between w-full px-1 text-[11px] font-mono mt-0.5">
                      {showSku && <span className="font-semibold text-zinc-800">{prod.code}</span>}
                      {showPrice && (
                        <span className="font-extrabold text-black ml-auto">
                          Rs. {Number(prod.selling_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#292b31]">
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#22242b] text-xs font-semibold text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>Download Barcode (SVG)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#22242b] text-sm text-[#f3f4f6] hover:bg-[#292b31]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-[#f0442f] hover:bg-[#ff5534] text-sm font-bold text-white shadow-lg transition active:scale-95 flex items-center gap-2"
            >
              <span>🖨️</span>
              <span>Print Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

