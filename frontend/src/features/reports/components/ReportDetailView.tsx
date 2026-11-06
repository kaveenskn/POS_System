import { useState, useMemo } from 'react';
import type { FC } from 'react';
import type {
  CurrentStockItem,
  LowStockItem,
  OutOfStockItem,
  PurchaseByProductItem,
  PurchaseBySupplierItem,
  PurchaseHistoryItem,
  ReportDatePreset,
  ReportId,
  SaleRecord,
  SupplierPaymentItem,
} from '../../../types/report.types';
import {
  ArrowLeftIcon,
  FileSpreadsheetIcon,
  FilePdfIcon,
  PrinterIcon,
  SearchIcon,
} from './ReportIcons';

interface ReportDetailViewProps {
  reportId: ReportId;
  reportTitle: string;
  categoryTitle: string;
  datePreset: ReportDatePreset;
  customStartDate: string;
  customEndDate: string;
  onBack: () => void;
  // Data props
  salesData?: {
    summary: {
      total_sales_amount: number;
      number_of_transactions: number;
      products_sold_count: number;
      total_discounts: number;
    };
    sales: SaleRecord[];
  } | null;
  currentStockData?: {
    total_stock_value: number;
    total_items_count: number;
    items: CurrentStockItem[];
  } | null;
  lowStockData?: {
    low_stock_count: number;
    items: LowStockItem[];
  } | null;
  outOfStockData?: {
    out_of_stock_count: number;
    items: OutOfStockItem[];
  } | null;
  purchasesBySupplierData?: {
    total_purchases_amount: number;
    total_outstanding: number;
    suppliers: PurchaseBySupplierItem[];
  } | null;
  purchasesByProductData?: {
    total_cost: number;
    total_units_purchased: number;
    products: PurchaseByProductItem[];
  } | null;
  purchaseHistoryData?: {
    total_amount: number;
    purchases: PurchaseHistoryItem[];
  } | null;
  supplierPaymentData?: {
    total_paid: number;
    total_outstanding: number;
    suppliers: SupplierPaymentItem[];
  } | null;
  isLoading: boolean;
}

export const ReportDetailView: FC<ReportDetailViewProps> = ({
  reportId,
  reportTitle,
  categoryTitle,
  datePreset,
  customStartDate,
  customEndDate,
  onBack,
  salesData,
  currentStockData,
  lowStockData,
  outOfStockData,
  purchasesBySupplierData,
  purchasesByProductData,
  purchaseHistoryData,
  supplierPaymentData,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique categories dynamically from real backend data
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    currentStockData?.items?.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    outOfStockData?.items?.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [currentStockData?.items, outOfStockData?.items]);

  // Format date range text for display and exports
  const dateRangeLabel = useMemo(() => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'this_week') return 'This Week';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'this_year') return 'This Year';
    if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
    return 'All Time';
  }, [datePreset, customStartDate, customEndDate]);

  // Handle browser print (formatted with @media print)
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV with specific headers and filtered records for each report
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportId.includes('sales')) {
      headers = ['Invoice #', 'Date', 'Customer', 'Cashier', 'Payment Method', 'Items Count', 'Discounts (Rs.)', 'Total (Rs.)'];
      const filtered = (salesData?.sales || []).filter(
        (s) =>
          searchQuery === '' ||
          s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((s) => [
        s.invoice_number,
        new Date(s.sale_date).toLocaleString(),
        `"${(s.customer_name || 'Walk-in Customer').replace(/"/g, '""')}"`,
        s.cashier_name,
        s.payment_method,
        s.items_count,
        s.discount_amount,
        s.total_amount,
      ]);
    } else if (reportId === 'current_stock') {
      headers = ['Product Name', 'SKU', 'Category', 'Current Quantity', 'Purchase Price (Rs.)', 'Selling Price (Rs.)', 'Stock Value (Rs.)'];
      const filtered = (currentStockData?.items || []).filter((p) => {
        const matchCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchQuery =
          searchQuery === '' ||
          p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchQuery;
      });
      rows = filtered.map((p) => [
        `"${p.product_name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category.replace(/"/g, '""')}"`,
        p.current_quantity,
        p.purchase_price,
        p.selling_price,
        p.stock_value,
      ]);
    } else if (reportId === 'low_stock') {
      headers = ['Product Name', 'SKU', 'Current Quantity', 'Low Stock Threshold', 'Status'];
      const filtered = (lowStockData?.items || []).filter(
        (p) =>
          searchQuery === '' ||
          p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((p) => [
        `"${p.product_name.replace(/"/g, '""')}"`,
        p.sku,
        p.current_quantity,
        p.low_stock_level,
        p.stock_status,
      ]);
    } else if (reportId === 'out_of_stock') {
      headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Last Stock Availability'];
      const filtered = (outOfStockData?.items || []).filter((p) => {
        const matchCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchQuery =
          searchQuery === '' ||
          p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchQuery;
      });
      rows = filtered.map((p) => [
        `"${p.product_name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        p.last_stock_availability ? new Date(p.last_stock_availability).toLocaleDateString() : 'N/A',
      ]);
    } else if (reportId === 'purchase_by_supplier') {
      headers = ['Supplier Name', 'Number of Purchases', 'Total Purchase Amount (Rs.)', 'Paid Amount (Rs.)', 'Outstanding Balance (Rs.)'];
      const filtered = (purchasesBySupplierData?.suppliers || []).filter(
        (s) => searchQuery === '' || s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((s) => [
        `"${s.supplier_name.replace(/"/g, '""')}"`,
        s.number_of_purchases,
        s.total_purchase_amount,
        s.paid_amount,
        s.outstanding_amount,
      ]);
    } else if (reportId === 'purchase_by_product') {
      headers = ['Product Name', 'SKU', 'Quantity Purchased', 'Total Purchase Cost (Rs.)', 'Last Purchase Date'];
      const filtered = (purchasesByProductData?.products || []).filter(
        (p) =>
          searchQuery === '' ||
          p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((p) => [
        `"${p.product_name.replace(/"/g, '""')}"`,
        p.sku,
        p.quantity_purchased,
        p.total_purchase_cost,
        p.last_purchase_date ? new Date(p.last_purchase_date).toLocaleDateString() : 'N/A',
      ]);
    } else if (reportId === 'purchase_history') {
      headers = ['Purchase ID', 'Supplier', 'Purchase Date', 'Total Amount (Rs.)', 'Payment Status'];
      const filtered = (purchaseHistoryData?.purchases || []).filter(
        (p) =>
          searchQuery === '' ||
          p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.payment_status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((p) => [
        p.purchase_number,
        `"${p.supplier_name.replace(/"/g, '""')}"`,
        new Date(p.purchase_date).toLocaleDateString(),
        p.total_amount,
        p.payment_status,
      ]);
    } else if (reportId === 'supplier_payments') {
      headers = ['Supplier Name', 'Total Orders (Rs.)', 'Total Paid (Rs.)', 'Outstanding Balance (Rs.)'];
      const filtered = (supplierPaymentData?.suppliers || []).filter(
        (s) => searchQuery === '' || s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      rows = filtered.map((s) => [
        `"${s.supplier_name.replace(/"/g, '""')}"`,
        s.total_amount,
        s.paid_amount,
        s.outstanding_balance,
      ]);
    }

    const metaLines = [
      `"Report","${reportTitle.replace(/"/g, '""')}"`,
      `"Period","${dateRangeLabel.replace(/"/g, '""')}"`,
      `"Generated Date","${new Date().toLocaleString()}"`,
      `"Total Records",${rows.length}`,
      '',
    ];

    const csvContent = [...metaLines, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    link.download = `TorqueLine_${cleanFilename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedSales = useMemo(() => {
    const list = [...(salesData?.sales || [])];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let valA: string | number = a.invoice_number;
      let valB: string | number = b.invoice_number;
      if (sortField === 'total') {
        valA = a.total_amount;
        valB = b.total_amount;
      } else if (sortField === 'date') {
        valA = new Date(a.sale_date).getTime();
        valB = new Date(b.sale_date).getTime();
      }
      if (valA === valB) return 0;
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [salesData?.sales, sortField, sortOrder]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292b31] pb-4 print:hidden">
        <div className="flex items-center gap-3.5">
          {/* Prominent Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-[#1b1c22] border border-[#292b31] hover:border-[#f0442f] hover:bg-[#22242b] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm group cursor-pointer"
            title="Return to Reports Dashboard"
          >
            <span className="text-[#f0442f] group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeftIcon />
            </span>
            <span>Back to Reports</span>
          </button>

          <div className="h-6 w-px bg-[#292b31] hidden sm:block" />

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#9a9ca6] mb-0.5">
              <span>{categoryTitle}</span>
              <span>/</span>
              <span className="text-[#f0442f] font-medium">{reportTitle}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>{reportTitle}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#202128] text-[#9a9ca6] border border-[#292b31]">
                {dateRangeLabel}
              </span>
            </h1>
          </div>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-[#292b31] bg-[#17181c] text-xs font-semibold text-[#f3f4f6] hover:bg-[#22242b] transition flex items-center gap-1.5"
            title="Download CSV / Excel spreadsheet"
          >
            <FileSpreadsheetIcon className="text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-[#292b31] bg-[#17181c] text-xs font-semibold text-[#f3f4f6] hover:bg-[#22242b] transition flex items-center gap-1.5"
            title="Export formatted PDF"
          >
            <FilePdfIcon className="text-rose-400" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-[#f0442f] text-xs font-semibold text-white shadow-md hover:bg-[#ff5534] transition active:scale-95 flex items-center gap-1.5"
          >
            <PrinterIcon />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable Letterhead (Only visible when printing) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">TorqueLine Moto Parts</h1>
            <p className="text-sm text-gray-700">Motorcycle Spare Parts & Service POS System</p>
            <p className="text-xs text-gray-600 mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-black uppercase">{reportTitle}</h2>
            <p className="text-xs font-semibold text-gray-700">Period: {dateRangeLabel}</p>
          </div>
        </div>
      </div>

      {/* CLEAN KPI METRIC CARDS (No cluttered descriptive paragraphs) */}
      {/* 1. Sales Reports Summary */}
      {reportId.includes('sales') && salesData?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Sales Amount</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
              Rs. {salesData.summary.total_sales_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Transactions</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              {salesData.summary.number_of_transactions} Invoices
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Products Sold</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#f0442f] mt-1">
              {salesData.summary.products_sold_count} units
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Discounts</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-amber-400 mt-1">
              Rs. {salesData.summary.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Current Stock Summary */}
      {reportId === 'current_stock' && currentStockData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Inventory Value</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
              Rs. {currentStockData.total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Available Units</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              {currentStockData.total_items_count} items
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Active SKUs</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#f0442f] mt-1">
              {currentStockData.items.length} SKUs
            </div>
          </div>
        </div>
      )}

      {/* 3. Low Stock Summary */}
      {reportId === 'low_stock' && lowStockData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Low Stock Critical Parts</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-amber-400 mt-1">
              {lowStockData.low_stock_count} Parts
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Catalog Safety Status</span>
            <div className="text-base font-semibold text-white mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Requires Restock Reorder</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Out of Stock Summary */}
      {reportId === 'out_of_stock' && outOfStockData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Depleted Stock Lines</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-rose-400 mt-1">
              {outOfStockData.out_of_stock_count} Products
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Inventory Availability</span>
            <div className="text-base font-semibold text-rose-400 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Zero Physical Stock</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Purchase by Supplier Summary */}
      {reportId === 'purchase_by_supplier' && purchasesBySupplierData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Purchases</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              Rs. {purchasesBySupplierData.total_purchases_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Paid to Suppliers</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
              Rs. {(purchasesBySupplierData.total_purchases_amount - purchasesBySupplierData.total_outstanding).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Outstanding Payables</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-rose-400 mt-1">
              Rs. {purchasesBySupplierData.total_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Purchase by Product Summary */}
      {reportId === 'purchase_by_product' && purchasesByProductData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Purchase Cost</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              Rs. {purchasesByProductData.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Units Purchased</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
              {purchasesByProductData.total_units_purchased} units
            </div>
          </div>
        </div>
      )}

      {/* 7. Purchase History Summary */}
      {reportId === 'purchase_history' && purchaseHistoryData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Invoiced Amount</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              Rs. {purchaseHistoryData.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Orders Recorded</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#f0442f] mt-1">
              {purchaseHistoryData.purchases.length} Orders
            </div>
          </div>
        </div>
      )}

      {/* 8. Supplier Payment Summary */}
      {reportId === 'supplier_payments' && supplierPaymentData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Total Disbursed</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
              Rs. {supplierPaymentData.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#17181c] border border-[#292b31]">
            <span className="text-[11px] font-medium text-[#9a9ca6]">Remaining Balance</span>
            <div className="text-lg sm:text-xl font-mono font-bold text-rose-400 mt-1">
              Rs. {supplierPaymentData.total_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#17181c] border border-[#292b31] p-2.5 rounded-xl print:hidden">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-[#6f727d]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records..."
            className="w-full bg-[#121316] border border-[#292b31] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#f3f4f6] placeholder-[#6f727d] focus:outline-none focus:border-[#f0442f]"
          />
        </div>

        {reportId.includes('stock') && (
          <div className="min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#121316] border border-[#292b31] rounded-lg px-2.5 py-1.5 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#f0442f]"
            >
              <option value="all">All Categories</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STRUCTURED REPORT DATA TABLES */}
      <div className="overflow-hidden rounded-xl border border-[#292b31] bg-[#17181c] shadow-lg">
        {isLoading ? (
          <div className="py-16 text-center text-[#9a9ca6]">
            <div className="inline-flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin text-[#f0442f]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs">Loading report records...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. SALES REPORT TABLE */}
            {reportId.includes('sales') && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('invoice')}>Invoice #</th>
                    <th className="px-4 py-2.5 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>Date & Time</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Cashier</th>
                    <th className="px-4 py-2.5 text-center">Items</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5 text-right">Discount</th>
                    <th className="px-4 py-2.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('total')}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {sortedSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-[#6f727d]">
                        No sales transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    sortedSales
                      .filter((s) =>
                        searchQuery === '' ||
                        s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-[#202229] transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-[#f0442f]">{s.invoice_number}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">{new Date(s.sale_date).toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-medium text-white">{s.customer_name || 'Walk-in Customer'}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">{s.cashier_name}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-semibold text-white">{s.items_count}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-[#22242b] border border-[#292b31] text-zinc-300">
                              {s.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-amber-400">
                            {s.discount_amount > 0 ? `Rs. ${s.discount_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                            Rs. {s.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}

            {/* 2. CURRENT STOCK REPORT TABLE */}
            {reportId === 'current_stock' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-center">Quantity</th>
                    <th className="px-4 py-2.5 text-right">Cost (Rs.)</th>
                    <th className="px-4 py-2.5 text-right">Price (Rs.)</th>
                    <th className="px-4 py-2.5 text-right">Stock Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(currentStockData?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#6f727d]">No stock items found.</td>
                    </tr>
                  ) : (
                    (currentStockData?.items || [])
                      .filter((p) => {
                        const matchCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
                        const matchQuery = searchQuery === '' || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchCat && matchQuery;
                      })
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#202229] transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-white">{p.product_name}</td>
                          <td className="px-4 py-2.5 font-mono text-[#f0442f]">{p.sku}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">{p.category}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-white">{p.current_quantity}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#9a9ca6]">{p.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-white font-semibold">{p.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">Rs. {p.stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}

            {/* 3. LOW STOCK REPORT TABLE */}
            {reportId === 'low_stock' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5 text-center">Current Qty</th>
                    <th className="px-4 py-2.5 text-center">Threshold</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(lowStockData?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-emerald-400">
                        ✓ All catalog spare parts have healthy inventory levels!
                      </td>
                    </tr>
                  ) : (
                    (lowStockData?.items || [])
                      .filter((p) => searchQuery === '' || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#202229] transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-white">{p.product_name}</td>
                          <td className="px-4 py-2.5 font-mono text-[#f0442f]">{p.sku}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-extrabold text-amber-400">{p.current_quantity}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-[#9a9ca6]">{p.low_stock_level}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Low Stock
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}

            {/* 4. OUT OF STOCK REPORT TABLE */}
            {reportId === 'out_of_stock' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Brand</th>
                    <th className="px-4 py-2.5">Last Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(outOfStockData?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-emerald-400">
                        ✓ No products are currently out of stock.
                      </td>
                    </tr>
                  ) : (
                    (outOfStockData?.items || [])
                      .filter((p) => searchQuery === '' || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#202229] transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-white">{p.product_name}</td>
                          <td className="px-4 py-2.5 font-mono text-[#f0442f]">{p.sku}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">{p.category}</td>
                          <td className="px-4 py-2.5 text-white font-medium">{p.brand}</td>
                          <td className="px-4 py-2.5 text-[#9a9ca6]">
                            {p.last_stock_availability ? new Date(p.last_stock_availability).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}

            {/* 5. PURCHASE BY SUPPLIER TABLE */}
            {reportId === 'purchase_by_supplier' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Supplier Name</th>
                    <th className="px-4 py-2.5 text-center">Orders</th>
                    <th className="px-4 py-2.5 text-right">Total Amount (Rs.)</th>
                    <th className="px-4 py-2.5 text-right">Paid (Rs.)</th>
                    <th className="px-4 py-2.5 text-right">Outstanding (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(purchasesBySupplierData?.suppliers || [])
                    .filter((s) => searchQuery === '' || s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s, idx) => (
                    <tr key={idx} className="hover:bg-[#202229] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-white">{s.supplier_name}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-white">{s.number_of_purchases}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-white">Rs. {s.total_purchase_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-400 font-semibold">Rs. {s.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-400">
                        {s.outstanding_amount > 0 ? `Rs. ${s.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Settled'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. PURCHASE BY PRODUCT TABLE */}
            {reportId === 'purchase_by_product' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5 text-center">Purchased</th>
                    <th className="px-4 py-2.5 text-right">Total Cost (Rs.)</th>
                    <th className="px-4 py-2.5">Last Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(purchasesByProductData?.products || [])
                    .filter((p) => searchQuery === '' || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#202229] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-white">{p.product_name}</td>
                      <td className="px-4 py-2.5 font-mono text-[#f0442f]">{p.sku}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-white">{p.quantity_purchased}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">Rs. {p.total_purchase_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-[#9a9ca6]">
                        {p.last_purchase_date ? new Date(p.last_purchase_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 7. PURCHASE HISTORY TABLE */}
            {reportId === 'purchase_history' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Purchase ID</th>
                    <th className="px-4 py-2.5">Supplier</th>
                    <th className="px-4 py-2.5">Order Date</th>
                    <th className="px-4 py-2.5 text-right">Total (Rs.)</th>
                    <th className="px-4 py-2.5 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(purchaseHistoryData?.purchases || [])
                    .filter((p) => searchQuery === '' || p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p) => (
                    <tr key={p.id} className="hover:bg-[#202229] transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-[#f0442f]">{p.purchase_number}</td>
                      <td className="px-4 py-2.5 font-semibold text-white">{p.supplier_name}</td>
                      <td className="px-4 py-2.5 text-[#9a9ca6]">{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-white">Rs. {p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          p.payment_status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 8. SUPPLIER PAYMENT REPORT TABLE */}
            {reportId === 'supplier_payments' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b1c22] text-[#9a9ca6] border-b border-[#292b31]">
                  <tr>
                    <th className="px-4 py-2.5">Supplier Name</th>
                    <th className="px-4 py-2.5 text-right">Total Orders</th>
                    <th className="px-4 py-2.5 text-right">Paid</th>
                    <th className="px-4 py-2.5 text-right">Balance</th>
                    <th className="px-4 py-2.5">Payment Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292b31]/50">
                  {(supplierPaymentData?.suppliers || [])
                    .filter((s) => searchQuery === '' || s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s, idx) => (
                    <tr key={idx} className="hover:bg-[#202229] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-white">{s.supplier_name}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-white">Rs. {s.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-400 font-bold">Rs. {s.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-400">
                        {s.outstanding_balance > 0 ? `Rs. ${s.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Settled'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#9a9ca6]">
                        {s.payments.length > 0 ? (
                          <div className="space-y-0.5">
                            {s.payments.map((pmt) => (
                              <div key={pmt.id} className="font-mono text-[11px] text-zinc-300">
                                • {new Date(pmt.payment_date).toLocaleDateString()}: Rs. {pmt.amount.toLocaleString()} ({pmt.payment_method})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-[#6f727d]">No payments</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Bottom Return Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#292b31]/40 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-[#17181c] border border-[#292b31] hover:border-[#f0442f] hover:bg-[#202229] text-[#9a9ca6] hover:text-white text-xs font-semibold transition flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-[#f0442f] group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeftIcon />
          </span>
          <span>Back to Reports Dashboard</span>
        </button>
        <span className="text-[11px] text-[#6f727d]">
          Showing data for <span className="text-zinc-400 font-medium">{dateRangeLabel}</span>
        </span>
      </div>
    </div>
  );
};
