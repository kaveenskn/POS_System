import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import type { FinancialSummary } from '../../types/reports.types';

export const ReportsPage: FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsService.getFinancialSummary();
      setSummary(data);
    } catch {
      setError('Unable to load financial reports. Make sure the backend server is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const totalRev = Number(summary?.total_revenue ?? 0);
  const totalCogs = Number(summary?.total_cogs ?? 0);
  const grossProfit = Number(summary?.gross_profit ?? 0);
  const operatingExpenses = Number(summary?.total_operating_expenses ?? 0);
  const salaryExpenses = Number(summary?.total_salary_expenses ?? 0);
  const totalExpenses = Number(summary?.total_expenses ?? 0);
  const netProfit = Number(summary?.net_profit ?? 0);

  const grossMargin = totalRev > 0 ? ((grossProfit / totalRev) * 100).toFixed(1) : '0.0';
  const netMargin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales & Expense Reports</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time financial summary, revenue, operating expenses, payroll overhead, and profit analysis
          </p>
        </div>
        <button
          type="button"
          onClick={loadSummary}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 border border-zinc-700 transition"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ✕ {error}
        </div>
      )}

      {/* Sales Snapshot (Today & This Month) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Today's Sales
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            Rs. {Number(summary?.today_sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {summary?.invoice_count_today ?? 0} invoices generated today
          </div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Monthly Sales
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            Rs. {Number(summary?.month_sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {summary?.invoice_count_month ?? 0} invoices this calendar month
          </div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Total Revenue (All Time)
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            Rs. {totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Cumulative sales across all paid invoices</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Cost of Goods Sold (COGS)
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            Rs. {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Inventory purchase cost for sold items</div>
        </div>
      </div>

      {/* Profitability & Margin Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gross & Net Profit Card */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-zinc-800 pb-3">
            Profitability Performance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#181a24] border border-zinc-800">
              <div>
                <div className="text-xs uppercase font-semibold text-zinc-400">Gross Profit</div>
                <div className="text-xs text-zinc-500">Revenue minus Cost of Goods Sold</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  Rs. {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-mono text-emerald-500/80">Margin: {grossMargin}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#181a24] border border-zinc-800">
              <div>
                <div className="text-xs uppercase font-semibold text-zinc-400">Net Profit</div>
                <div className="text-xs text-zinc-500">After deducting all operating & salary expenses</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xl font-bold font-mono ${
                    netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  Rs. {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-xs font-mono ${
                    netProfit >= 0 ? 'text-emerald-500/80' : 'text-red-400'
                  }`}
                >
                  Net Margin: {netMargin}%
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">Accounting Formula:</div>
            <div>• Gross Profit = Total Revenue - COGS</div>
            <div>• Net Profit = Gross Profit - (Operating Expenses + Employee Salaries)</div>
          </div>
        </div>

        {/* Expense Distribution Card */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-zinc-800 pb-3">
            Expense Breakdown
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#181a24] border border-zinc-800">
              <div>
                <div className="text-xs uppercase font-semibold text-zinc-400">Total Operating Expenses</div>
                <div className="text-xs text-zinc-500">Utilities, shop rent, maintenance, transit</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-amber-400">
                  Rs. {operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#181a24] border border-zinc-800">
              <div>
                <div className="text-xs uppercase font-semibold text-zinc-400">Total Salary Expenses</div>
                <div className="text-xs text-zinc-500">Staff wages paid via employee payroll module</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-purple-400">
                  Rs. {salaryExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div>
                <div className="text-xs uppercase font-bold text-red-400">Total Expenses Combined</div>
                <div className="text-xs text-zinc-500">Operating overhead + Paid payroll (no double counts)</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-red-400">
                  Rs. {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Shortcuts */}
      <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
          Financial & Operational Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="p-4 rounded-xl bg-[#181a24] border border-zinc-800 hover:border-[#eb4826]/50 transition text-left group"
          >
            <div className="text-sm font-bold text-white group-hover:text-[#eb4826] transition flex items-center justify-between">
              <span>🧾 POS & Invoices</span>
              <span>→</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Open cash register, make bills, search invoice history</div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="p-4 rounded-xl bg-[#181a24] border border-zinc-800 hover:border-[#eb4826]/50 transition text-left group"
          >
            <div className="text-sm font-bold text-white group-hover:text-[#eb4826] transition flex items-center justify-between">
              <span>💸 Business Expenses</span>
              <span>→</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Record electricity, water, rent, and miscellaneous costs</div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="p-4 rounded-xl bg-[#181a24] border border-zinc-800 hover:border-[#eb4826]/50 transition text-left group"
          >
            <div className="text-sm font-bold text-white group-hover:text-[#eb4826] transition flex items-center justify-between">
              <span>👥 Staff & Payroll</span>
              <span>→</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">Set monthly salaries, record advances, and pay staff</div>
          </button>
        </div>
      </div>
    </div>
  );
};

