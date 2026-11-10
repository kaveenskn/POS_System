import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardResponse } from '../../types/dashboard.types';
import { dashboardService } from '../../services/dashboardService';
import { CategoryDistributionCard } from './components/CategoryDistributionCard';
import { Icon } from './components/Icon';
import { LowStockAlertsCard } from './components/LowStockAlertsCard';
import { RecentInvoicesCard } from './components/RecentInvoicesCard';
import { SalesOverview } from './components/SalesOverview';
import { StatCard } from './components/StatCard';
import { TopSellingPartsCard } from './components/TopSellingPartsCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7days' | '6months'>('7days');

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await dashboardService.getDashboardMetrics();
      setData(response);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to synchronize with backend POS database. Please verify your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  const todayFormatted = new Intl.DateTimeFormat('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 rounded-2xl bg-[#17181c] border border-[#292b31] p-6" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#17181c] border border-[#292b31] p-6" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-72 rounded-2xl bg-[#17181c] border border-[#292b31] p-6" />

        {/* 2-col Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-[#17181c] border border-[#292b31]" />
          <div className="h-64 rounded-2xl bg-[#17181c] border border-[#292b31]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-[#17181c] p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">POS Database Connection Issue</h2>
        <p className="text-sm text-[#8a8d99] mb-6">{error}</p>
        <button
          type="button"
          onClick={() => void fetchMetrics(true)}
          className="px-5 py-2.5 rounded-xl bg-[#f04b2f] hover:bg-[#ff6547] text-white font-semibold text-sm transition-all shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const summary = data?.summary ?? {
    today_sales: 0,
    today_invoices_count: 0,
    yesterday_sales: 0,
    month_sales: 0,
    month_invoices_count: 0,
    total_revenue: 0,
    total_invoices_count: 0,
    total_products: 0,
    total_stock_units: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_inventory_value: 0,
    total_customers: 0,
  };

  const salesChangeToday =
    summary.yesterday_sales > 0
      ? Math.round(((summary.today_sales - summary.yesterday_sales) / summary.yesterday_sales) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Live Welcome Banner */}
      <section
        className="welcome-banner relative overflow-hidden border border-[#292b31] rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#17181c] via-[#1a1c22] to-[#261517] shadow-xl"
        aria-labelledby="welcome-title"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live POS Active
              </span>
              <span className="text-xs text-[#8a8d99] hidden sm:inline">{todayFormatted}</span>
            </div>

            <h1 id="welcome-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight !mb-1">
              TorqueLine Moto Parts
            </h1>
            <p className="text-sm text-[#9a9ca6]">
              Real-time executive performance dashboard & inventory monitoring
            </p>
          </div>

          {/* Quick POS Navigation & Manual Sync */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchMetrics(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121316] hover:bg-[#1e2027] border border-[#2a2d36] text-xs font-semibold text-[#c8cbda] transition-all disabled:opacity-50"
              title="Refresh live metrics from database"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>
                <Icon name="refresh" size={14} />
              </span>
              <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/sales')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f04b2f] hover:bg-[#ff6547] text-white text-xs font-bold transition-all shadow-lg shadow-[#f04b2f]/20 hover:scale-[1.02]"
            >
              <Icon name="cart" size={16} />
              <span>+ New POS Sale</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1c22] hover:bg-[#252730] border border-[#2c2f38] text-white text-xs font-semibold transition-all"
            >
              <Icon name="package" size={16} />
              <span>Manage Stock</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1c22] hover:bg-[#252730] border border-[#2c2f38] text-white text-xs font-semibold transition-all"
            >
              <Icon name="chart" size={16} />
              <span>Reports</span>
            </button>
          </div>
        </div>
      </section>

      {/* Primary KPI Metrics Grid */}
      <section className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Business statistics">
        <StatCard
          label="Today's Sales"
          value={`Rs. ${summary.today_sales.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`${summary.today_invoices_count} ${summary.today_invoices_count === 1 ? 'invoice' : 'invoices'} completed`}
          icon="trend"
          tone="orange"
          badge={
            salesChangeToday !== null
              ? {
                  text: `${salesChangeToday >= 0 ? '+' : ''}${salesChangeToday}% vs yesterday`,
                  positive: salesChangeToday >= 0,
                }
              : { text: 'Today', neutral: true }
          }
        />

        <StatCard
          label="Total Revenue"
          value={`Rs. ${summary.total_revenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`${summary.total_invoices_count} all-time completed invoices`}
          icon="money"
          tone="green"
          badge={{ text: 'All-Time', neutral: true }}
        />

        <StatCard
          label="Total Catalog Products"
          value={`${summary.total_products}`}
          description={`${summary.total_stock_units} warehouse units (Val: Rs. ${summary.total_inventory_value.toLocaleString('en-LK', { maximumFractionDigits: 0 })})`}
          icon="package"
          tone="gray"
          badge={{ text: 'In Stock', neutral: true }}
        />

        <StatCard
          label="Stock Reorder Warnings"
          value={`${summary.low_stock_count + summary.out_of_stock_count}`}
          description={`${summary.low_stock_count} low stock, ${summary.out_of_stock_count} out of stock`}
          icon="warning"
          tone="yellow"
          badge={
            summary.out_of_stock_count > 0
              ? { text: `${summary.out_of_stock_count} Critical`, positive: false }
              : { text: 'Active Monitoring', neutral: true }
          }
        />
      </section>

      {/* Interactive Sales Overview Dynamic Line & Area Chart */}
      <SalesOverview
        salesTrendDays={data?.sales_trend_days ?? []}
        monthlyTrend={data?.monthly_trend ?? []}
        activePeriod={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {/* Middle Two-Column Grid: Fast-Moving Parts & Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingPartsCard products={data?.top_selling_products ?? []} />
        <LowStockAlertsCard alerts={data?.low_stock_alerts ?? []} />
      </div>

      {/* Live Sales Transactions Table */}
      <RecentInvoicesCard invoices={data?.recent_invoices ?? []} />

      {/* Category Spread */}
      <CategoryDistributionCard categories={data?.category_distribution ?? []} />
    </div>
  );
}
