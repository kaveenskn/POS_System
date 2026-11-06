import { useState, useEffect, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import { reportService } from '../../services/reportService';
import type {
  CurrentStockReportResponse,
  LowStockReportResponse,
  OutOfStockReportResponse,
  PurchaseByProductResponse,
  PurchaseBySupplierResponse,
  PurchaseHistoryResponse,
  ReportCategoryKey,
  ReportDatePreset,
  ReportId,
  ReportOverviewResponse,
  SalesReportResponse,
  SupplierPaymentResponse,
} from '../../types/report.types';
import { ReportDetailView } from './components/ReportDetailView';
import {
  CalendarIcon,
  BarChartIcon,
  TrendingUpIcon,
  TrophyIcon,
  BoxIcon,
  AlertTriangleIcon,
  XCircleIcon,
  TruckIcon,
  GearIcon,
  ReceiptIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from './components/ReportIcons';

interface ReportMeta {
  id: ReportId;
  title: string;
  tag: string;
  icon: ReactNode;
  category: ReportCategoryKey;
  categoryTitle: string;
  accentColor: 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo';
}

const REPORT_DEFINITIONS: ReportMeta[] = [
  // --- A. SALES REPORTS (4) ---
  {
    id: 'daily_sales',
    title: 'Daily Sales Report',
    tag: 'Daily Turnover',
    icon: <CalendarIcon className="text-emerald-400" />,
    category: 'sales',
    categoryTitle: 'Sales Reports',
    accentColor: 'emerald',
  },
  {
    id: 'weekly_sales',
    title: 'Weekly Sales Report',
    tag: '7-Day Trend',
    icon: <BarChartIcon className="text-emerald-400" />,
    category: 'sales',
    categoryTitle: 'Sales Reports',
    accentColor: 'emerald',
  },
  {
    id: 'monthly_sales',
    title: 'Monthly Sales Report',
    tag: 'Monthly Revenue',
    icon: <TrendingUpIcon className="text-emerald-400" />,
    category: 'sales',
    categoryTitle: 'Sales Reports',
    accentColor: 'emerald',
  },
  {
    id: 'yearly_sales',
    title: 'Yearly Sales Report',
    tag: 'Annual Summary',
    icon: <TrophyIcon className="text-emerald-400" />,
    category: 'sales',
    categoryTitle: 'Sales Reports',
    accentColor: 'emerald',
  },

  // --- B. INVENTORY REPORTS (3) ---
  {
    id: 'current_stock',
    title: 'Current Stock Report',
    tag: 'Live Valuation',
    icon: <BoxIcon className="text-amber-400" />,
    category: 'inventory',
    categoryTitle: 'Inventory Reports',
    accentColor: 'amber',
  },
  {
    id: 'low_stock',
    title: 'Low Stock Report',
    tag: 'Reorder Alerts',
    icon: <AlertTriangleIcon className="text-amber-400" />,
    category: 'inventory',
    categoryTitle: 'Inventory Reports',
    accentColor: 'amber',
  },
  {
    id: 'out_of_stock',
    title: 'Out-of-Stock Products',
    tag: 'Zero Balance',
    icon: <XCircleIcon className="text-rose-400" />,
    category: 'inventory',
    categoryTitle: 'Inventory Reports',
    accentColor: 'rose',
  },

  // --- C. PURCHASE REPORTS (4) ---
  {
    id: 'purchase_by_supplier',
    title: 'Purchase by Supplier',
    tag: 'Vendor Volume',
    icon: <TruckIcon className="text-cyan-400" />,
    category: 'purchases',
    categoryTitle: 'Purchase Reports',
    accentColor: 'cyan',
  },
  {
    id: 'purchase_by_product',
    title: 'Purchase by Product',
    tag: 'Part Procurement',
    icon: <GearIcon className="text-cyan-400" />,
    category: 'purchases',
    categoryTitle: 'Purchase Reports',
    accentColor: 'cyan',
  },
  {
    id: 'purchase_history',
    title: 'Purchase History',
    tag: 'Order Ledger',
    icon: <ReceiptIcon className="text-indigo-400" />,
    category: 'purchases',
    categoryTitle: 'Purchase Reports',
    accentColor: 'indigo',
  },
  {
    id: 'supplier_payments',
    title: 'Supplier Payment Report',
    tag: 'Payables Audit',
    icon: <CreditCardIcon className="text-indigo-400" />,
    category: 'purchases',
    categoryTitle: 'Purchase Reports',
    accentColor: 'indigo',
  },
];

export const ReportsPage: FC = () => {
  // Navigation State
  const [selectedReportId, setSelectedReportId] = useState<ReportId | null>(null);

  // Category Tab Filter
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | ReportCategoryKey>('all');

  // Date Filter State
  const [datePreset, setDatePreset] = useState<ReportDatePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Overview metrics state (strictly loaded from database via backend, no hardcoded dummy data)
  const [overviewMetrics, setOverviewMetrics] = useState<ReportOverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Active Report Data States
  const [isLoading, setIsLoading] = useState(false);
  const [salesReportData, setSalesReportData] = useState<SalesReportResponse | null>(null);
  const [currentStockData, setCurrentStockData] = useState<CurrentStockReportResponse | null>(null);
  const [lowStockData, setLowStockData] = useState<LowStockReportResponse | null>(null);
  const [outOfStockData, setOutOfStockData] = useState<OutOfStockReportResponse | null>(null);
  const [purchasesBySupplierData, setPurchasesBySupplierData] = useState<PurchaseBySupplierResponse | null>(null);
  const [purchasesByProductData, setPurchasesByProductData] = useState<PurchaseByProductResponse | null>(null);
  const [purchaseHistoryData, setPurchaseHistoryData] = useState<PurchaseHistoryResponse | null>(null);
  const [supplierPaymentData, setSupplierPaymentData] = useState<SupplierPaymentResponse | null>(null);

  // Fetch report data based on selected report
  const loadActiveReportData = useCallback(async (reportId: ReportId) => {
    setIsLoading(true);
    try {
      if (reportId === 'daily_sales') {
        const data = await reportService.getSalesReport('daily', customStartDate, customEndDate);
        setSalesReportData(data);
      } else if (reportId === 'weekly_sales') {
        const data = await reportService.getSalesReport('weekly', customStartDate, customEndDate);
        setSalesReportData(data);
      } else if (reportId === 'monthly_sales') {
        const data = await reportService.getSalesReport('monthly', customStartDate, customEndDate);
        setSalesReportData(data);
      } else if (reportId === 'yearly_sales') {
        const data = await reportService.getSalesReport('yearly', customStartDate, customEndDate);
        setSalesReportData(data);
      } else if (reportId === 'current_stock') {
        const data = await reportService.getCurrentStockReport();
        setCurrentStockData(data);
      } else if (reportId === 'low_stock') {
        const data = await reportService.getLowStockReport();
        setLowStockData(data);
      } else if (reportId === 'out_of_stock') {
        const data = await reportService.getOutOfStockReport();
        setOutOfStockData(data);
      } else if (reportId === 'purchase_by_supplier') {
        const data = await reportService.getPurchasesBySupplier(datePreset, customStartDate, customEndDate);
        setPurchasesBySupplierData(data);
      } else if (reportId === 'purchase_by_product') {
        const data = await reportService.getPurchasesByProduct(datePreset, customStartDate, customEndDate);
        setPurchasesByProductData(data);
      } else if (reportId === 'purchase_history') {
        const data = await reportService.getPurchaseHistory(datePreset, customStartDate, customEndDate);
        setPurchaseHistoryData(data);
      } else if (reportId === 'supplier_payments') {
        const data = await reportService.getSupplierPayments();
        setSupplierPaymentData(data);
      }
    } catch (err) {
      console.error('Failed to load report data from backend', err);
    } finally {
      setIsLoading(false);
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Overview data load from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      setIsLoadingOverview(true);
      try {
        const data = await reportService.getOverview(datePreset, customStartDate, customEndDate);
        if (isMounted) {
          setOverviewMetrics(data);
        }
      } catch (err) {
        console.error('Failed to load overview metrics from backend', err);
        if (isMounted) {
          setOverviewMetrics({
            sales_total: 0,
            transactions_count: 0,
            stock_value: 0,
            total_stock_items: 0,
            low_stock_count: 0,
            out_of_stock_count: 0,
            pending_payables: 0,
            total_paid_suppliers: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingOverview(false);
        }
      }
    };

    fetchOverview();
    return () => {
      isMounted = false;
    };
  }, [datePreset, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedReportId) {
      loadActiveReportData(selectedReportId);
    }
  }, [selectedReportId, loadActiveReportData]);

  const selectedMeta = REPORT_DEFINITIONS.find((r) => r.id === selectedReportId);

  // Group definitions for main category sections
  const salesReports = REPORT_DEFINITIONS.filter((r) => r.category === 'sales');
  const inventoryReports = REPORT_DEFINITIONS.filter((r) => r.category === 'inventory');
  const purchaseReports = REPORT_DEFINITIONS.filter((r) => r.category === 'purchases');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. If an individual report is opened, render detailed report view */}
      {selectedReportId && selectedMeta ? (
        <ReportDetailView
          reportId={selectedReportId}
          reportTitle={selectedMeta.title}
          categoryTitle={selectedMeta.categoryTitle}
          datePreset={datePreset}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onBack={() => setSelectedReportId(null)}
          salesData={salesReportData}
          currentStockData={currentStockData}
          lowStockData={lowStockData}
          outOfStockData={outOfStockData}
          purchasesBySupplierData={purchasesBySupplierData}
          purchasesByProductData={purchasesByProductData}
          purchaseHistoryData={purchaseHistoryData}
          supplierPaymentData={supplierPaymentData}
          isLoading={isLoading}
        />
      ) : (
        /* 2. MAIN REPORTS DASHBOARD VIEW */
        <div className="space-y-6">
          {/* Top Title & Date Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#292b31] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9a9ca6] mb-1">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-[#f0442f] font-medium">Reports</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Reports
              </h1>
              <p className="text-xs sm:text-sm text-[#9a9ca6] mt-0.5">
                View and analyze your shop&apos;s sales, inventory, and purchase activities.
              </p>
            </div>

            {/* Date Range Selector Bar */}
            <div className="flex flex-wrap items-center gap-1 bg-[#17181c] p-1.5 rounded-xl border border-[#292b31]">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'custom', label: 'Custom' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    datePreset === preset.id
                      ? 'bg-[#f0442f] text-white shadow-md'
                      : 'text-[#9a9ca6] hover:text-white hover:bg-[#22242b]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              {datePreset === 'custom' && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#292b31] ml-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-[#121316] border border-[#292b31] rounded px-2 py-1 text-xs text-white"
                  />
                  <span className="text-xs text-[#6f727d]">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-[#121316] border border-[#292b31] rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* QUICK SNAPSHOT METRIC CARDS (Dynamic Backend Data) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-gradient-to-b from-[#1b1c22] to-[#16171b] border border-[#292b31] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#9a9ca6]">Revenue ({datePreset.replace('_', ' ')})</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {isLoadingOverview && !overviewMetrics ? (
                    <span className="animate-pulse text-[#6f727d]">...</span>
                  ) : (
                    `Rs. ${(overviewMetrics?.sales_total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUpIcon className="text-emerald-400" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-b from-[#1b1c22] to-[#16171b] border border-[#292b31] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#9a9ca6]">Inventory Value</span>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {isLoadingOverview && !overviewMetrics ? (
                    <span className="animate-pulse text-[#6f727d]">...</span>
                  ) : (
                    `Rs. ${(overviewMetrics?.stock_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <BoxIcon className="text-amber-400" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-b from-[#1b1c22] to-[#16171b] border border-[#292b31] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#9a9ca6]">Low Stock Alerts</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {isLoadingOverview && !overviewMetrics ? (
                    <span className="animate-pulse text-[#6f727d]">...</span>
                  ) : (
                    `${overviewMetrics?.low_stock_count ?? 0} Parts`
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangleIcon className="text-amber-400" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-b from-[#1b1c22] to-[#16171b] border border-[#292b31] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#9a9ca6]">Vendor Payables</span>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  {isLoadingOverview && !overviewMetrics ? (
                    <span className="animate-pulse text-[#6f727d]">...</span>
                  ) : (
                    `Rs. ${(overviewMetrics?.pending_payables ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <CreditCardIcon className="text-rose-400" />
              </div>
            </div>
          </div>

          {/* CATEGORY SWITCHER PILLS */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#292b31]/40">
            {(
              [
                { id: 'all', label: 'All', count: 11 },
                { id: 'sales', label: 'Sales', count: 4 },
                { id: 'inventory', label: 'Inventory', count: 3 },
                { id: 'purchases', label: 'Purchases', count: 4 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                  activeCategoryTab === tab.id
                    ? 'bg-[#292b31] text-white border border-[#3f414a]'
                    : 'text-[#9a9ca6] hover:text-white hover:bg-[#1a1b20]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategoryTab === tab.id ? 'bg-[#f0442f] text-white' : 'bg-[#24262d] text-[#6f727d]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* THREE CLEAR CATEGORY SECTIONS */}
          <div className="space-y-6">
            {/* CATEGORY A: SALES REPORTS */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'sales') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <h2 className="text-base font-bold text-white tracking-tight">Sales Reports</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    4 Reports
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {salesReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className="group p-4 rounded-xl bg-gradient-to-b from-[#18191e] to-[#141518] border border-[#292b31] hover:border-[#f0442f]/60 hover:shadow-lg hover:shadow-red-950/20 transition-all text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#202128] border border-[#2b2d35] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#282a33] transition-all">
                          {report.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#f0442f] transition">
                            {report.title}
                          </h3>
                          <span className="inline-block text-[11px] text-[#80838e] group-hover:text-[#9a9ca6] transition mt-0.5">
                            {report.tag}
                          </span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#202128] border border-[#2b2d35] flex items-center justify-center text-[#6f727d] group-hover:text-[#f0442f] group-hover:border-[#f0442f]/40 group-hover:translate-x-0.5 transition-all">
                        <ArrowRightIcon />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORY B: INVENTORY REPORTS */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'inventory') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <h2 className="text-base font-bold text-white tracking-tight">Inventory Reports</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    3 Reports
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inventoryReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className="group p-4 rounded-xl bg-gradient-to-b from-[#18191e] to-[#141518] border border-[#292b31] hover:border-[#f0442f]/60 hover:shadow-lg hover:shadow-red-950/20 transition-all text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#202128] border border-[#2b2d35] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#282a33] transition-all">
                          {report.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#f0442f] transition">
                            {report.title}
                          </h3>
                          <span className="inline-block text-[11px] text-[#80838e] group-hover:text-[#9a9ca6] transition mt-0.5">
                            {report.tag}
                          </span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#202128] border border-[#2b2d35] flex items-center justify-center text-[#6f727d] group-hover:text-[#f0442f] group-hover:border-[#f0442f]/40 group-hover:translate-x-0.5 transition-all">
                        <ArrowRightIcon />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORY C: PURCHASE REPORTS */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'purchases') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    <h2 className="text-base font-bold text-white tracking-tight">Purchase Reports</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-400/90 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    4 Reports
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {purchaseReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className="group p-4 rounded-xl bg-gradient-to-b from-[#18191e] to-[#141518] border border-[#292b31] hover:border-[#f0442f]/60 hover:shadow-lg hover:shadow-red-950/20 transition-all text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#202128] border border-[#2b2d35] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#282a33] transition-all">
                          {report.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#f0442f] transition">
                            {report.title}
                          </h3>
                          <span className="inline-block text-[11px] text-[#80838e] group-hover:text-[#9a9ca6] transition mt-0.5">
                            {report.tag}
                          </span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-[#202128] border border-[#2b2d35] flex items-center justify-center text-[#6f727d] group-hover:text-[#f0442f] group-hover:border-[#f0442f]/40 group-hover:translate-x-0.5 transition-all">
                        <ArrowRightIcon />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
