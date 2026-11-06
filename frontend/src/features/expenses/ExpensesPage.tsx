import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { expenseService } from '../../services/expenseService';
import type {
  Expense,
  ExpenseCreateInput,
  ExpenseSummary,
} from '../../types/expense.types';
import { EXPENSE_CATEGORY_LABELS } from '../../types/expense.types';

export const ExpensesPage: FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        expenseService.getExpenses({
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
  }, [categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleDeleteExpense = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete expense "${title}"?`)) return;
    try {
      await expenseService.deleteExpense(id);
      showNotification(`Expense "${title}" deleted.`);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      showNotification(e?.response?.data?.detail ?? 'Failed to delete expense.', 'error');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expense Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track business overheads, shop utilities, rent, maintenance, and operating costs
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#eb4826] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-[#ff5534] active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Total Expenses ({summary?.period_label ?? 'All Time'})
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            Rs. {Number(summary?.total_all ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Operating + Salary overheads</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Operating Expenses
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            Rs. {Number(summary?.total_operating ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Utilities, rent, repairs & transit</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Salary Overheads
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            Rs. {Number(summary?.total_salary ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Auto-synced from employee payroll</div>
        </div>
      </div>

      {/* Filter / Controls Bar */}
      <div className="bg-[#14161d] p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Filter by Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
          >
            <option value="">All Categories</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
          />
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
          />
        </div>

        {(categoryFilter || dateFrom || dateTo) && (
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
                <th className="px-6 py-4">Title / Purpose</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount (LKR)</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No expense records found. Click "Add Expense" to record an expense!
                  </td>
                </tr>
              ) : (
                expenses.map((item) => {
                  const isSalary = item.category === 'salary';
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isSalary
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : item.category === 'electricity' || item.category === 'water'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : item.category === 'rent'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {EXPENSE_CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-red-400">
                        Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                        {item.expense_date}
                      </td>
                      <td className="px-6 py-4 capitalize text-zinc-300">
                        {item.payment_method.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSalary ? (
                          <span className="text-xs text-zinc-500 italic">Payroll-managed</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
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
                              onClick={() => handleDeleteExpense(item.id, item.title)}
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
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#161820] text-xs text-zinc-500">
          Showing {expenses.length} of {total} expenses
        </div>
      </div>

      {/* Expense Modal */}
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
    </div>
  );
};
