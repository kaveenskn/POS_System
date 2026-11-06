import { apiClient } from '../lib/api';
import type {
  Employee,
  EmployeeCreateInput,
  EmployeeListResponse,
  EmployeeUpdateInput,
  SalaryRecord,
  SalaryRecordCreate,
  SalaryRecordUpdate,
} from '../types/employee.types';

const INITIAL_MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'Kasun Perera',
    phone: '077 123 4567',
    role: 'Chief Motorcycle Mechanic',
    monthly_salary: 65000.0,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Nuwan Pradeep',
    phone: '071 987 6543',
    role: 'Sales Assistant & Billing Cashier',
    monthly_salary: 50000.0,
    is_active: true,
    created_at: '2026-09-15T08:30:00Z',
  },
  {
    id: 3,
    name: 'Chaminda Silva',
    phone: '075 334 4556',
    role: 'Spare Parts Inventory & Store Keeper',
    monthly_salary: 55000.0,
    is_active: true,
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 4,
    name: 'Dinesh Kumara',
    phone: '078 998 8776',
    role: 'Junior Technician & Electricals',
    monthly_salary: 42000.0,
    is_active: true,
    created_at: '2026-10-10T10:00:00Z',
  },
];

const INITIAL_MOCK_SALARIES: SalaryRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: 'Kasun Perera',
    month: 10,
    year: 2026,
    base_salary: 65000.0,
    advance_amount: 0.0,
    net_paid: 65000.0,
    payment_date: '2026-11-02',
    status: 'paid',
    notes: 'Regular monthly salary credited via bank transfer',
    created_at: '2026-10-31T18:00:00Z',
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: 'Nuwan Pradeep',
    month: 10,
    year: 2026,
    base_salary: 50000.0,
    advance_amount: 2000.0,
    net_paid: 48000.0,
    payment_date: '2026-11-02',
    status: 'paid',
    notes: 'Mid-month cash advance of Rs. 2,000 deducted',
    created_at: '2026-10-31T18:00:00Z',
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: 'Chaminda Silva',
    month: 10,
    year: 2026,
    base_salary: 55000.0,
    advance_amount: 5000.0,
    net_paid: 50000.0,
    payment_date: null,
    status: 'pending',
    notes: 'Advance of Rs. 5,000 given on 15th October',
    created_at: '2026-10-31T18:00:00Z',
  },
  {
    id: 4,
    employee_id: 4,
    employee_name: 'Dinesh Kumara',
    month: 10,
    year: 2026,
    base_salary: 42000.0,
    advance_amount: 0.0,
    net_paid: 42000.0,
    payment_date: null,
    status: 'pending',
    notes: 'Pending bank settlement',
    created_at: '2026-10-31T18:00:00Z',
  },
];

const EMPLOYEES_KEY = 'torqueline_employees_cache';
const SALARIES_KEY = 'torqueline_salaries_cache';

function getLocalEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }
  return [...INITIAL_MOCK_EMPLOYEES];
}

function saveLocalEmployees(items: Employee[]) {
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage errors
  }
}

function getLocalSalaries(): SalaryRecord[] {
  try {
    const raw = localStorage.getItem(SALARIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }
  return [...INITIAL_MOCK_SALARIES];
}

function saveLocalSalaries(items: SalaryRecord[]) {
  try {
    localStorage.setItem(SALARIES_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage errors
  }
}

export const employeeService = {
  async getEmployees(params?: {
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<EmployeeListResponse> {
    try {
      const res = await apiClient.get<EmployeeListResponse>('/employees', { params });
      if (res.data && Array.isArray(res.data.items)) {
        if (res.data.items.length > 0) {
          saveLocalEmployees(res.data.items);
          return res.data;
        }
      }
    } catch {
      // Offline fallback
    }

    let items = [...getLocalEmployees()];
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          (e.phone && e.phone.includes(q))
      );
    }

    return {
      items,
      total: items.length,
    };
  },

  async createEmployee(input: EmployeeCreateInput): Promise<Employee> {
    try {
      const res = await apiClient.post<Employee>('/employees', input);
      if (res.data && res.data.id) {
        const local = getLocalEmployees();
        saveLocalEmployees([res.data, ...local]);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalEmployees();
    const newId = local.length > 0 ? Math.max(...local.map((e) => e.id)) + 1 : 1;
    const newEmp: Employee = {
      id: newId,
      name: input.name,
      phone: input.phone ?? null,
      role: input.role,
      monthly_salary: input.monthly_salary,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    saveLocalEmployees([newEmp, ...local]);
    return newEmp;
  },

  async updateEmployee(id: number, input: EmployeeUpdateInput): Promise<Employee> {
    try {
      const res = await apiClient.patch<Employee>(`/employees/${id}`, input);
      if (res.data) {
        const local = getLocalEmployees().map((e) => (e.id === id ? res.data : e));
        saveLocalEmployees(local);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalEmployees();
    let updated: Employee | null = null;
    const next = local.map((e) => {
      if (e.id === id) {
        updated = { ...e, ...input };
        return updated;
      }
      return e;
    });
    saveLocalEmployees(next);
    if (!updated) throw new Error('Employee not found');
    return updated;
  },

  async getEmployeeSalaries(employeeId: number): Promise<SalaryRecord[]> {
    try {
      const res = await apiClient.get<SalaryRecord[]>(`/employees/${employeeId}/salaries`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const all = getLocalSalaries();
    return all.filter((s) => s.employee_id === employeeId);
  },

  async createSalaryRecord(employeeId: number, input: SalaryRecordCreate): Promise<SalaryRecord> {
    try {
      const res = await apiClient.post<SalaryRecord>(`/employees/${employeeId}/salaries`, input);
      if (res.data && res.data.id) {
        const all = getLocalSalaries();
        saveLocalSalaries([res.data, ...all]);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const all = getLocalSalaries();
    const emp = getLocalEmployees().find((e) => e.id === employeeId);
    const newId = all.length > 0 ? Math.max(...all.map((s) => s.id)) + 1 : 1;
    const advance = input.advance_amount ?? 0;
    const net = Math.max(0, input.base_salary - advance);

    const record: SalaryRecord = {
      id: newId,
      employee_id: employeeId,
      employee_name: emp ? emp.name : `Employee #${employeeId}`,
      month: input.month,
      year: input.year,
      base_salary: input.base_salary,
      advance_amount: advance,
      net_paid: net,
      payment_date: null,
      status: 'pending',
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };

    saveLocalSalaries([record, ...all]);
    return record;
  },

  async updateSalaryRecord(salaryId: number, input: SalaryRecordUpdate): Promise<SalaryRecord> {
    try {
      const res = await apiClient.patch<SalaryRecord>(`/employees/salaries/${salaryId}`, input);
      if (res.data) {
        const all = getLocalSalaries().map((s) => (s.id === salaryId ? res.data : s));
        saveLocalSalaries(all);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const all = getLocalSalaries();
    let updated: SalaryRecord | null = null;
    const next = all.map((s) => {
      if (s.id === salaryId) {
        const newAdvance = input.advance_amount !== undefined ? input.advance_amount : s.advance_amount;
        const newNet = Math.max(0, s.base_salary - newAdvance);
        updated = {
          ...s,
          ...input,
          advance_amount: newAdvance,
          net_paid: newNet,
        };
        return updated;
      }
      return s;
    });

    saveLocalSalaries(next);
    if (!updated) throw new Error('Salary record not found');
    return updated;
  },
};
