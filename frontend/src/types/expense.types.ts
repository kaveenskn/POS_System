export type ExpenseCategory =
  | 'electricity'
  | 'water'
  | 'rent'
  | 'internet'
  | 'transportation'
  | 'maintenance'
  | 'salary'
  | 'other';

export type ExpensePaymentMethod = 'cash' | 'card' | 'bank_transfer';

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string; // ISO date string YYYY-MM-DD
  payment_method: ExpensePaymentMethod;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreateInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  payment_method: ExpensePaymentMethod;
  description?: string;
}

export interface ExpenseUpdateInput {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  expense_date?: string;
  payment_method?: ExpensePaymentMethod;
  description?: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
}

export interface ExpenseSummary {
  total_all: number;
  total_salary: number;
  total_operating: number;
  period_label: string;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  electricity: 'Electricity',
  water: 'Water',
  rent: 'Shop Rent',
  internet: 'Internet',
  transportation: 'Transportation',
  maintenance: 'Maintenance & Repairs',
  salary: 'Employee Salary',
  other: 'Other',
};

