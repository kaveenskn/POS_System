import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import { SalaryPanel } from './components/SalaryPanel';
import { employeeService } from '../../services/employeeService';
import type {
  Employee,
  EmployeeCreateInput,
} from '../../types/employee.types';

export const EmployeesPage: FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedForSalary, setSelectedForSalary] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await employeeService.getEmployees({ limit: 100 });
      setEmployees(res.items);
      setTotal(res.total);
    } catch {
      showNotification('Failed to load employee list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSaveEmployee = async (data: EmployeeCreateInput) => {
    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, data);
        showNotification(`Employee "${data.name}" updated successfully.`);
      } else {
        await employeeService.createEmployee(data);
        showNotification(`Employee "${data.name}" added successfully.`);
      }
      setIsFormOpen(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      showNotification(e?.response?.data?.detail ?? 'Failed to save employee.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await employeeService.updateEmployee(employee.id, {
        is_active: !employee.is_active,
      });
      showNotification(
        `Employee "${employee.name}" marked as ${!employee.is_active ? 'Active' : 'Inactive'}.`
      );
      loadEmployees();
    } catch {
      showNotification('Failed to update employee status.', 'error');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  // Calculations for summary cards
  const activeCount = employees.filter((e) => e.is_active).length;
  const totalMonthlyPayroll = employees
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + Number(e.monthly_salary), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Salary Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage staff profiles, monthly wages, advances, and payroll payment records
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
          Add Employee
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Active Staff Members
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {activeCount} <span className="text-sm text-zinc-500 font-normal">/ {total} registered</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Current team size on payroll</div>
        </div>

        <div className="bg-[#14161d] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Monthly Base Payroll Commitment
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            Rs. {totalMonthlyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Sum of regular monthly salaries for active staff</div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#14161d]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#181a22] text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Monthly Salary (LKR)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No employees registered yet. Click "Add Employee" to register staff.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{emp.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">ID: #{emp.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                      {emp.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                      Rs. {Number(emp.monthly_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          emp.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedForSalary(emp)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 transition"
                        >
                          💳 Salaries & History
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(emp)}
                          className="text-xs text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
                          title="Edit Employee"
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
                          onClick={() => handleToggleActive(emp)}
                          className="text-xs text-zinc-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                          title={emp.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {emp.is_active ? '⏸' : '▶'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-[#161820] text-xs text-zinc-500">
          Showing {employees.length} staff members
        </div>
      </div>

      {/* Employee Add / Edit Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleSaveEmployee}
        isLoading={isSubmitting}
        initialData={editingEmployee}
      />

      {/* Salary & Payroll slide-in Panel */}
      <SalaryPanel
        employee={selectedForSalary}
        isOpen={!!selectedForSalary}
        onClose={() => setSelectedForSalary(null)}
        onSalaryPaid={() => {
          showNotification('Salary payment recorded and synced to Expenses.');
        }}
      />
    </div>
  );
};
