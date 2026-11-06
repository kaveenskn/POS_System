import { useEffect, useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Employee, EmployeeCreateInput } from '../../../types/employee.types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeCreateInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Employee | null;
}

export const EmployeeFormModal: FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Mechanic');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone || '');
      setRole(initialData.role);
      setMonthlySalary(initialData.monthly_salary.toString());
    } else {
      reset();
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const reset = () => {
    setName('');
    setPhone('');
    setRole('Sales Assistant');
    setMonthlySalary('');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const salary = parseFloat(monthlySalary);
    if (isNaN(salary) || salary <= 0) {
      setError('Monthly salary must be greater than 0.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role.trim(),
        monthly_salary: salary,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Failed to save employee.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emp-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#14161d] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-5">
          <h2 id="emp-modal-title" className="text-lg font-bold">
            {initialData ? 'Edit Employee' : 'Add New Employee'}
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
            <label htmlFor="emp-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Full Name <span className="text-[#eb4826]">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasun Perera"
              className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          <div>
            <label htmlFor="emp-role" className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Role / Designation <span className="text-[#eb4826]">*</span>
            </label>
            <input
              id="emp-role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Mechanic, Store Keeper, Sales Assistant"
              className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emp-phone" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Phone Number
              </label>
              <input
                id="emp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0771234567"
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
              />
            </div>
            <div>
              <label htmlFor="emp-salary" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Monthly Salary (Rs.) <span className="text-[#eb4826]">*</span>
              </label>
              <input
                id="emp-salary"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="65000.00"
                className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eb4826]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
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
              {isLoading ? 'Saving...' : initialData ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

