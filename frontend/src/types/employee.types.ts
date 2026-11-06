export type SalaryStatus = 'pending' | 'paid';

export interface Employee {
  id: number;
  name: string;
  phone: string | null;
  role: string;
  monthly_salary: number;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeCreateInput {
  name: string;
  phone?: string;
  role: string;
  monthly_salary: number;
}

export interface EmployeeUpdateInput {
  name?: string;
  phone?: string;
  role?: string;
  monthly_salary?: number;
  is_active?: boolean;
}

export interface SalaryRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  month: number;
  year: number;
  base_salary: number;
  advance_amount: number;
  net_paid: number;
  payment_date: string | null;
  status: SalaryStatus;
  notes: string | null;
  created_at: string;
}

export interface SalaryRecordCreate {
  month: number;
  year: number;
  base_salary: number;
  advance_amount?: number;
  notes?: string;
}

export interface SalaryRecordUpdate {
  status?: SalaryStatus;
  payment_date?: string;
  advance_amount?: number;
  notes?: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
}

export interface SalaryListResponse {
  items: SalaryRecord[];
  total: number;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

