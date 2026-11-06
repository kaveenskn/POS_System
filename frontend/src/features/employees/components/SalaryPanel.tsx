import { useCallback, useEffect, useState } from 'react';
import type { FC, FormEvent } from 'react';
import { employeeService } from '../../../services/employeeService';
import type { Employee, SalaryRecord, SalaryRecordCreate } from '../../../types/employee.types';
import { MONTH_NAMES } from '../../../types/employee.types';

interface SalaryPanelProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSalaryPaid?: () => void;
}

export const SalaryPanel: FC<SalaryPanelProps> = ({
  employee,
  isOpen,
  onClose,
  onSalaryPaid,
}) => {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating record
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [baseSalary, setBaseSalary] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [notes, setNotes] = useState('');

  const loadSalaries = useCallback(async () => {
    if (!employee) return;
    setIsLoading(true);
    try {
      const records = await employeeService.getEmployeeSalaries(employee.id);
      setSalaries(records);
    } catch {
      setError('Failed to load salary history.');
    } finally {
      setIsLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (isOpen && employee) {
      setBaseSalary(employee.monthly_salary.toString());
      setAdvanceAmount('0');
      setNotes('');
      setShowCreateForm(false);
      setError(null);
      loadSalaries();
    }
  }, [isOpen, employee, loadSalaries]);

  if (!isOpen || !employee) return null;

  const handleCreateRecord = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const base = parseFloat(baseSalary);
    const advance = parseFloat(advanceAmount) || 0;
    if (isNaN(base) || base <= 0) {
      setError('Base salary must be greater than 0.');
      return;
    }
    if (advance < 0) {
      setError('Advance amount cannot be negative.');
      return;
    }

    setIsCreating(true);
    try {
      const payload: SalaryRecordCreate = {
        month,
        year,
        base_salary: base,
        advance_amount: advance,
        notes: notes.trim() || undefined,
      };
      await employeeService.createSalaryRecord(employee.id, payload);
      setShowCreateForm(false);
      loadSalaries();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Failed to record salary.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAsPaid = async (salary: SalaryRecord) => {
    const today = new Date().toISOString().slice(0, 10);
    if (
      !window.confirm(
        `Confirm paying Rs. ${salary.net_paid.toLocaleString()} to ${employee.name} for ${
          MONTH_NAMES[salary.month - 1]
        } ${salary.year}?\n\nThis will automatically log an expense record under 'Employee Salary'.`
      )
    ) {
      return;
    }

    try {
      await employeeService.updateSalaryRecord(salary.id, {
        status: 'paid',
        payment_date: today,
      });
      loadSalaries();
      if (onSalaryPaid) onSalaryPaid();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Failed to update payment status.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salary-panel-title"
    >
      <div className="relative w-full max-w-2xl h-full bg-[#14161d] border-l border-zinc-800 p-6 shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="salary-panel-title" className="text-xl font-bold">
                {employee.name}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {employee.role}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Monthly Base Salary:{' '}
              <span className="font-mono font-semibold text-emerald-400">
                Rs. {Number(employee.monthly_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Salary & Advance Records
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#eb4826] hover:bg-[#ff5534] text-white transition"
            >
              {showCreateForm ? 'Cancel Form' : '+ Add Month Salary'}
            </button>
          </div>

          {/* Form to create salary record */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateRecord}
              className="bg-[#181a24] p-4 rounded-xl border border-zinc-800 space-y-3"
            >
              <div className="text-xs font-bold text-white mb-2">Record Salary for Month</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Base Salary (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Advance Taken (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Advance taken on 10th for festival"
                  className="w-full bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#eb4826] hover:bg-[#ff5534] text-white disabled:opacity-50"
                >
                  {isCreating ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          )}

          {/* List of Salaries */}
          {isLoading ? (
            <div className="text-center py-8 text-zinc-500 text-xs">Loading salary records...</div>
          ) : salaries.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
              No salary records yet for {employee.name}. Click "+ Add Month Salary" above to record one.
            </div>
          ) : (
            <div className="space-y-3">
              {salaries.map((sal) => {
                const isPaid = sal.status === 'paid';
                return (
                  <div
                    key={sal.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-[#161822] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {MONTH_NAMES[sal.month - 1]} {sal.year}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex flex-wrap gap-x-3 font-mono">
                        <span>Base: Rs. {Number(sal.base_salary).toLocaleString()}</span>
                        {sal.advance_amount > 0 && (
                          <span className="text-amber-400">
                            Advance: -Rs. {Number(sal.advance_amount).toLocaleString()}
                          </span>
                        )}
                        <span className="text-white font-bold">
                          Net: Rs. {Number(sal.net_paid).toLocaleString()}
                        </span>
                      </div>
                      {sal.notes && <div className="text-xs text-zinc-500 italic mt-0.5">{sal.notes}</div>}
                      {sal.payment_date && (
                        <div className="text-[11px] text-zinc-500">Paid on: {sal.payment_date}</div>
                      )}
                    </div>

                    <div>
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(sal)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
                        >
                          ✓ Mark as Paid
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-mono">✓ Recorded in Expenses</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
          💡 Marking a salary as paid automatically posts an expense entry to ensure non-duplicate financial reporting.
        </div>
      </div>
    </div>
  );
};
