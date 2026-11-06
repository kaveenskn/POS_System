import { useEffect, useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Expense, ExpenseCategory, ExpenseCreateInput, ExpensePaymentMethod } from '../../../types/expense.types';
import { EXPENSE_CATEGORY_LABELS } from '../../../types/expense.types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreateInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Expense | null;
}

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS).filter(
  ([k]) => k !== 'salary'
) as [ExpenseCategory, string][];

const PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export const ExpenseFormModal: FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('electricity');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setDate(initialData.expense_date);
      setPaymentMethod(initialData.payment_method);
      setDescription(initialData.description || '');
    } else {
      reset();
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setCategory('electricity');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('cash');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    try {
      await onSubmit({
        title: title.trim(),
        category,
        amount: amt,
        expense_date: date,
        payment_method: paymentMethod,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Failed to save expense.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exp-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[#14161d] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-5">
          <h2 id="exp-modal-title" className="text-lg font-bold">
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="exp-title" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Title <span className="text-[#eb4826]">*</span>
            </label>
            <input
              id="exp-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Bill - Branch 1"
              className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-cat" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Category <span className="text-[#eb4826]">*</span>
              </label>
              <select
                id="exp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              >
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exp-amount" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Amount (Rs.) <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="exp-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-date" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Date <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="exp-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              />
            </div>
            <div>
              <label htmlFor="exp-pay" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Payment Method
              </label>
              <select
                id="exp-pay"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#eb4826]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="exp-desc" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Description <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="exp-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes or reference number..."
              className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#eb4826] hover:bg-[#ff5534] text-white shadow-md transition disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

