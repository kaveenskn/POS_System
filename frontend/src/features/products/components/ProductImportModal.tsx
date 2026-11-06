import { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import type { Product, ProductCreateInput } from '../../../types/product.types';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirmed: (items: ProductCreateInput[]) => Promise<void>;
  existingProducts: Product[];
}

interface ParsedRow {
  rowNum: number;
  name: string;
  code: string;
  barcode: string;
  category: string;
  brand: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  unit: string;
  isValid: boolean;
  error?: string;
}

export const ProductImportModal: FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportConfirmed,
  existingProducts,
}) => {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,SKU,Barcode,Category,Brand,CostPrice,SellingPrice,Quantity,Unit\n' +
      '"Motul Fork Oil Expert 10W","MOT-FORK-10W","337465024799","Oils & Lubricants","Motul",1800,2450,15,"Bottles"\n' +
      '"NGK Spark Plug CPR8EA-9","NGK-SP-CPR8EA","087295123065","Electrical & Ignition","NGK",450,750,50,"Pieces"\n' +
      '"Brembo Rear Brake Pads","BRM-BP-002","200109283799","Braking System","Brembo",1650,2350,12,"Pairs"\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'torqueline_product_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length <= 1) {
      alert('The CSV file appears to be empty or contains only a header.');
      return;
    }

    const existingSkus = new Set(existingProducts.map((p) => p.code.toLowerCase()));
    const existingBarcodes = new Set(
      existingProducts.filter((p) => p.barcode).map((p) => p.barcode!.toLowerCase())
    );

    const parsed: ParsedRow[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // simple comma split handling quotes
      const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 7) continue;

      const [name, code, barcode, category, brand, costStr, sellStr, qtyStr, unitStr] = parts;
      const cost = parseFloat(costStr) || 0;
      const sell = parseFloat(sellStr) || 0;
      const qty = parseInt(qtyStr, 10) || 0;
      const unit = unitStr || 'Pieces';

      let isValid = true;
      let error = '';

      if (!name) {
        isValid = false;
        error = 'Missing product name';
      } else if (!code) {
        isValid = false;
        error = 'Missing SKU code';
      } else if (existingSkus.has(code.toLowerCase())) {
        isValid = false;
        error = `Duplicate SKU '${code}' exists`;
      } else if (barcode && existingBarcodes.has(barcode.toLowerCase())) {
        isValid = false;
        error = `Duplicate Barcode '${barcode}' exists`;
      } else if (cost <= 0) {
        isValid = false;
        error = 'Cost price must be > 0';
      } else if (sell <= 0) {
        isValid = false;
        error = 'Selling price must be > 0';
      }

      parsed.push({
        rowNum: i,
        name,
        code,
        barcode: barcode || '',
        category: category || 'Motorcycle Spare Parts',
        brand: brand || 'TorqueLine',
        cost_price: cost,
        selling_price: sell,
        quantity: qty,
        unit,
        isValid,
        error,
      });
    }

    setRows(parsed);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => r.isValid);

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);

    try {
      const payload: ProductCreateInput[] = validRows.map((r) => ({
        name: r.name,
        code: r.code,
        barcode: r.barcode || null,
        barcode_type: 'CODE128',
        category: r.category,
        brand: r.brand,
        cost_price: r.cost_price,
        selling_price: r.selling_price,
        quantity: r.quantity,
        opening_stock: r.quantity,
        unit: r.unit,
        min_stock_level: 5,
        reorder_level: 10,
        status: 'active',
      }));

      await onImportConfirmed(payload);
      setImportSummary({
        success: validRows.length,
        failed: rows.length - validRows.length,
      });
    } catch {
      alert('Failed to import products');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#17181c] border border-[#292b31] p-6 shadow-2xl text-left my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#f0442f]/10 text-[#f0442f] flex items-center justify-center text-lg">
              📥
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Bulk Import Products</h3>
              <p className="text-xs text-[#9a9ca6]">Upload CSV/Excel file to add parts in bulk</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#9a9ca6] hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {importSummary ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
              ✓
            </div>
            <h4 className="text-lg font-bold text-white">Import Complete!</h4>
            <p className="text-xs text-[#9a9ca6]">
              Successfully imported <strong>{importSummary.success}</strong> parts into inventory.{' '}
              {importSummary.failed > 0 && `(${importSummary.failed} invalid rows skipped)`}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#f0442f] text-sm font-semibold text-white hover:bg-[#ff5534]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-6 flex-1 overflow-y-auto">
            {/* Step 1: Template download & file drop */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#121316] border border-[#292b31]">
              <div>
                <div className="text-sm font-semibold text-white">Need the correct column format?</div>
                <div className="text-xs text-[#9a9ca6] mt-0.5">
                  Download the sample template with pre-filled motorcycle parts examples.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-semibold text-white hover:bg-[#2b2d35] flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>📄</span>
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Step 2: Upload Box */}
            <div className="border-2 border-dashed border-[#292b31] rounded-2xl p-6 text-center hover:border-[#f0442f] transition cursor-pointer relative bg-[#121316]/50">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">📂</span>
                <p className="text-sm font-semibold text-white">
                  {fileName ? fileName : 'Choose or drag & drop a .CSV file here'}
                </p>
                <p className="text-xs text-[#9a9ca6] mt-1">UTF-8 comma-separated format supported</p>
              </div>
            </div>

            {/* Step 3: Parsed Rows Preview */}
            {rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Preview ({validRows.length} valid / {rows.length - validRows.length} invalid)
                  </span>
                  <span className="text-[#9a9ca6]">{validRows.length} will be imported</span>
                </div>

                <div className="overflow-x-auto max-h-[220px] rounded-xl border border-[#292b31] bg-[#121316]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#17181c] text-[#9a9ca6] border-b border-[#292b31]">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Part Name</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Brand</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                        <th className="px-3 py-2 text-right">Retail</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#292b31]/60">
                      {rows.map((r) => (
                        <tr key={r.rowNum} className={r.isValid ? '' : 'bg-rose-500/10'}>
                          <td className="px-3 py-2 text-[#9a9ca6]">{r.rowNum}</td>
                          <td className="px-3 py-2">
                            {r.isValid ? (
                              <span className="text-emerald-400 font-semibold">✓ Valid</span>
                            ) : (
                              <span className="text-rose-400 font-semibold" title={r.error}>
                                ✕ {r.error}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-white font-medium line-clamp-1">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-[#f0442f]">{r.code}</td>
                          <td className="px-3 py-2 text-zinc-300">{r.brand}</td>
                          <td className="px-3 py-2 text-right font-mono">{r.cost_price}</td>
                          <td className="px-3 py-2 text-right font-mono">{r.selling_price}</td>
                          <td className="px-3 py-2 text-center font-bold">{r.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-[#292b31] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#292b31] bg-[#22242b] text-sm text-[#f3f4f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={validRows.length === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2.5 rounded-xl bg-[#f0442f] hover:bg-[#ff5534] text-sm font-bold text-white shadow-lg disabled:opacity-40"
              >
                {isImporting ? 'Importing...' : `Confirm Import (${validRows.length} Items)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

