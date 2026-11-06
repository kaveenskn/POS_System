import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { expenseService } from '../../services/expenseService';
import type {
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseSummary,
} from '../../types/expense.types';
import { CATEGORY_ICONS, EXPENSE_CATEGORY_LABELS } from '../../types/expense.types';

type PeriodPreset = 'all' | 'today' | 'month' | 'year' | 'custom';

export const ExpensesPage: FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick period helper
  const handleSelectPeriod = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (preset === 'year') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
      setDateFrom(firstDayOfYear);
      setDateTo(todayStr);
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        expenseService.getExpenses({
          search: searchTerm.trim() || undefined,
          category: categoryFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          limit: 100,
        }),
        expenseService.getSummary({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      ]);
      setExpenses(listRes.items);
      setTotal(listRes.total);
      setSummary(summaryRes);
    } catch {
      showNotification('Failed to load expenses data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side payment method filtering if selected
  const displayedExpenses = useMemo(() => {
    if (!paymentFilter) return expenses;
    return expenses.filter((e) => e.payment_method === paymentFilter);
  }, [expenses, paymentFilter]);

  const handleSaveExpense = async (data: ExpenseCreateInput) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, data);
        showNotification(`Expense "${data.title}" updated.`);
      } else {
        await expenseService.createExpense(data);
        showNotification(`Expense "${data.title}" added successfully.`);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      showNotification(e?.response?.data?.detail ?? 'Failed to save expense.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      await expenseService.deleteExpense(deletingExpense.id);
      showNotification(`Expense "${deletingExpense.title}" deleted.`);
      setDeletingExpense(null);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      showNotification(e?.response?.data?.detail ?? 'Failed to delete expense.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setPeriodPreset('all');
    setDateFrom('');
    setDateTo('');
    setCategoryFilter('');
    setPaymentFilter('');
    setSearchTerm('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Statistics & breakdowns
  const totalAll = Number(summary?.total_all ?? 0);
  const totalOperating = Number(summary?.total_operating ?? 0);
  const totalSalary = Number(summary?.total_salary ?? 0);
  const avgExpense = displayedExpenses.length > 0 ? totalAll / displayedExpenses.length : 0;

  return (
    <div className="space-y-6">
      {/* Header and Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Expense Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-normal">
              Overheads & Payroll
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track utilities, shop rent, maintenance, transportation, and employee salary overheads
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 border border-zinc-700 transition"
            title="Print or export expense report"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#eb4826] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-[#ff5534] active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{notification.type === 'success' ? '✓ ' : '✕ '} {notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Period Presets Navigation */}
      <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">
            Period:
          </span>
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ] as { id: PeriodPreset; label: string }[]
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPeriod(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                periodPreset === preset.id
                  ? 'bg-[#eb4826] text-white shadow-md'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-zinc-400">
          Showing: <span className="text-white font-semibold">{summary?.period_label ?? 'All Time'}</span>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when custom is selected or dates manually filled) */}
      {periodPreset === 'custom' && (
        <div className="bg-[#181a24] border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0b0c10] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0b0c10] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="self-end px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Expenses
            </span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            Rs. {totalAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {displayedExpenses.length} transactions recorded
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Card 2: Operating */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Operating Overheads
            </span>
            <span className="text-lg">🏢</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            Rs. {totalOperating.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {totalAll > 0 ? ((totalOperating / totalAll) * 100).toFixed(1) : 0}% of all expenses
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Card 3: Salary */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Employee Salaries
            </span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            Rs. {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Payroll payouts (auto-linked)
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Card 4: Average */}
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Average Expense
            </span>
            <span className="text-lg">📊</span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-200">
            Rs. {avgExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Per recorded transaction</div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14161d] p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Search Expenses</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, purpose, or description..."
              className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
            />
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
          >
            <option value="">All Categories</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {CATEGORY_ICONS[k as ExpenseCategory]} {v}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Payment Method</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
          >
            <option value="">All Methods</option>
            <option value="cash">💵 Cash</option>
            <option value="card">💳 Card</option>
            <option value="bank_transfer">🏦 Bank Transfer</option>
          </select>
        </div>

        {/* Reset button if any filter is active */}
        {(categoryFilter || dateFrom || dateTo || searchTerm || paymentFilter || periodPreset !== 'all') && (
          <div className="self-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#14161d]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#181a22] text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Title / Expense Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount (LKR)</th>
                <th className="px-6 py-4">Expense Date</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Loading expense records...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No expense records found matching current criteria. Click "Add Expense" to record a new business expense!
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((item) => {
                  const isSalary = item.category === 'salary';
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{item.title}</span>
                          {isSalary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Payroll Sync
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isSalary
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : item.category === 'electricity' || item.category === 'water'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : item.category === 'rent'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : item.category === 'transportation'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.category === 'maintenance'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          <span>{CATEGORY_ICONS[item.category]}</span>
                          <span>{EXPENSE_CATEGORY_LABELS[item.category] || item.category}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-red-400">
                        Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                        {item.expense_date}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 capitalize text-xs">
                        <span className="inline-flex items-center gap-1">
                          {item.payment_method === 'cash' && '💵'}
                          {item.payment_method === 'card' && '💳'}
                          {item.payment_method === 'bank_transfer' && '🏦'}
                          <span>{item.payment_method.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSalary ? (
                          <span className="text-xs text-purple-400/80 italic font-mono">
                            Auto-locked
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpense(item);
                                setIsModalOpen(true);
                              }}
                              className="text-xs text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
                              title="Edit Expense"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingExpense(item)}
                              className="text-xs text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                              title="Delete Expense"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#161820] text-xs text-zinc-400 flex items-center justify-between">
          <span>
            Showing {displayedExpenses.length} of {total} expenses
          </span>
          {categoryFilter && (
            <span className="text-zinc-500">
              Filtered by: {EXPENSE_CATEGORY_LABELS[categoryFilter as ExpenseCategory]}
            </span>
          )}
        </div>
      </div>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        isLoading={isSubmitting}
        initialData={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="relative w-full max-w-sm bg-[#14161d] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="text-center">
              <h3 id="delete-dialog-title" className="text-base font-bold text-white">
                Delete Expense Record?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-white">"{deletingExpense.title}"</strong> (Rs.{' '}
                {Number(deletingExpense.amount).toLocaleString()})? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteExpense}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
