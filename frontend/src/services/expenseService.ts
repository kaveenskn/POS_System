import { apiClient } from '../lib/api';
import type {
  Expense,
  ExpenseCreateInput,
  ExpenseListResponse,
  ExpenseSummary,
  ExpenseUpdateInput,
} from '../types/expense.types';

const INITIAL_MOCK_EXPENSES: Expense[] = [
  {
    id: 1,
    title: 'Shop Monthly Rent - Central Store Colombo',
    category: 'rent',
    amount: 85000.0,
    expense_date: '2026-11-01',
    payment_method: 'bank_transfer',
    description: 'Monthly commercial shop space rent for Colombo 10 spare parts retail outlet',
    created_at: '2026-11-01T09:00:00Z',
    updated_at: '2026-11-01T09:00:00Z',
  },
  {
    id: 2,
    title: 'CEB Workshop Electricity Bill - Oct 2026',
    category: 'electricity',
    amount: 18450.0,
    expense_date: '2026-11-03',
    payment_method: 'bank_transfer',
    description: 'Power consumption for compressor, diagnostic tooling, and showroom lighting',
    created_at: '2026-11-03T11:30:00Z',
    updated_at: '2026-11-03T11:30:00Z',
  },
  {
    id: 3,
    title: 'Staff Salary - Kasun Perera (Lead Mechanic)',
    category: 'salary',
    amount: 65000.0,
    expense_date: '2026-11-02',
    payment_method: 'bank_transfer',
    description: 'Salary payment for month of October 2026 (ID #1)',
    created_at: '2026-11-02T14:00:00Z',
    updated_at: '2026-11-02T14:00:00Z',
  },
  {
    id: 4,
    title: 'Staff Salary - Nuwan Pradeep (Sales Assistant)',
    category: 'salary',
    amount: 48000.0,
    expense_date: '2026-11-02',
    payment_method: 'bank_transfer',
    description: 'Salary payment after advance deduction for month 10/2026 (ID #2)',
    created_at: '2026-11-02T14:15:00Z',
    updated_at: '2026-11-02T14:15:00Z',
  },
  {
    id: 5,
    title: 'Motorcycle Spare Parts Transport & Freight',
    category: 'transportation',
    amount: 12500.0,
    expense_date: '2026-11-04',
    payment_method: 'cash',
    description: 'Brembo and Motul stock transport from Colombo Port clearing yard',
    created_at: '2026-11-04T10:00:00Z',
    updated_at: '2026-11-04T10:00:00Z',
  },
  {
    id: 6,
    title: 'Dialog Business 100Mbps Fibre Broadband',
    category: 'internet',
    amount: 6850.0,
    expense_date: '2026-11-04',
    payment_method: 'card',
    description: 'Monthly POS terminal, CCTV remote viewing, and inventory system internet',
    created_at: '2026-11-04T16:20:00Z',
    updated_at: '2026-11-04T16:20:00Z',
  },
  {
    id: 7,
    title: 'Hydraulic Bike Lift & Air Compressor Maintenance',
    category: 'maintenance',
    amount: 9500.0,
    expense_date: '2026-11-05',
    payment_method: 'cash',
    description: 'Oil replacement and seal kit overhaul for 2-ton hydraulic servicing ramp',
    created_at: '2026-11-05T13:45:00Z',
    updated_at: '2026-11-05T13:45:00Z',
  },
  {
    id: 8,
    title: 'National Water Supply & Drainage Board Bill',
    category: 'water',
    amount: 3200.0,
    expense_date: '2026-11-05',
    payment_method: 'cash',
    description: 'Workshop water utility bill for bike wash and sanitation',
    created_at: '2026-11-05T15:10:00Z',
    updated_at: '2026-11-05T15:10:00Z',
  },
  {
    id: 9,
    title: 'Office Stationery & Thermal Receipt Rolls',
    category: 'other',
    amount: 4600.0,
    expense_date: '2026-11-06',
    payment_method: 'cash',
    description: '80mm POS thermal paper rolls (50 pack) and voucher clipboards',
    created_at: '2026-11-06T09:30:00Z',
    updated_at: '2026-11-06T09:30:00Z',
  },
];

const LOCAL_STORAGE_KEY = 'torqueline_expenses_cache';

function getLocalExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }
  return [...INITIAL_MOCK_EXPENSES];
}

function saveLocalExpenses(expenses: Expense[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // Ignore localStorage errors
  }
}

export const expenseService = {
  async getExpenses(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ExpenseListResponse> {
    try {
      const res = await apiClient.get<ExpenseListResponse>('/expenses', { params });
      if (res.data && Array.isArray(res.data.items)) {
        if (res.data.items.length > 0) {
          saveLocalExpenses(res.data.items);
          return res.data;
        }
      }
    } catch {
      // Backend offline / sync fallback
    }

    let items = [...getLocalExpenses()];

    // Search filter
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (params?.category && params.category !== 'all') {
      items = items.filter((e) => e.category === params.category);
    }

    // Date range filter
    if (params?.date_from) {
      items = items.filter((e) => e.expense_date >= params.date_from!);
    }
    if (params?.date_to) {
      items = items.filter((e) => e.expense_date <= params.date_to!);
    }

    // Sort descending by date
    items.sort((a, b) => (b.expense_date > a.expense_date ? 1 : -1));

    const total = items.length;
    const skip = params?.skip ?? 0;
    const limit = params?.limit ?? 100;
    const paged = items.slice(skip, skip + limit);

    return { items: paged, total };
  },

  async createExpense(input: ExpenseCreateInput): Promise<Expense> {
    try {
      const res = await apiClient.post<Expense>('/expenses', input);
      if (res.data && res.data.id) {
        const local = getLocalExpenses();
        saveLocalExpenses([res.data, ...local]);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalExpenses();
    const newId = local.length > 0 ? Math.max(...local.map((e) => e.id)) + 1 : 1;
    const newExpense: Expense = {
      id: newId,
      title: input.title,
      category: input.category,
      amount: input.amount,
      expense_date: input.expense_date,
      payment_method: input.payment_method,
      description: input.description ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalExpenses([newExpense, ...local]);
    return newExpense;
  },

  async updateExpense(id: number, input: ExpenseUpdateInput): Promise<Expense> {
    try {
      const res = await apiClient.patch<Expense>(`/expenses/${id}`, input);
      if (res.data) {
        const local = getLocalExpenses().map((e) => (e.id === id ? res.data : e));
        saveLocalExpenses(local);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalExpenses();
    let updated: Expense | null = null;
    const next = local.map((e) => {
      if (e.id === id) {
        updated = {
          ...e,
          ...input,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return e;
    });
    saveLocalExpenses(next);
    if (!updated) throw new Error('Expense not found');
    return updated;
  },

  async deleteExpense(id: number): Promise<void> {
    try {
      await apiClient.delete(`/expenses/${id}`);
    } catch {
      // Offline fallback
    }
    const local = getLocalExpenses().filter((e) => e.id !== id);
    saveLocalExpenses(local);
  },

  async getSummary(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<ExpenseSummary> {
    try {
      const res = await apiClient.get<ExpenseSummary>('/expenses/summary', { params });
      if (res.data && Number(res.data.total_all) > 0) {
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    let items = [...getLocalExpenses()];
    if (params?.date_from) {
      items = items.filter((e) => e.expense_date >= params.date_from!);
    }
    if (params?.date_to) {
      items = items.filter((e) => e.expense_date <= params.date_to!);
    }

    const by_category: Record<string, number> = {};
    let total_all = 0;
    let total_salary = 0;
    let total_operating = 0;

    for (const item of items) {
      const amt = Number(item.amount) || 0;
      total_all += amt;
      by_category[item.category] = (by_category[item.category] || 0) + amt;
      if (item.category === 'salary') {
        total_salary += amt;
      } else {
        total_operating += amt;
      }
    }

    const period_label =
      params?.date_from && params?.date_to
        ? `${params.date_from} to ${params.date_to}`
        : 'All Time';

    return {
      total_all,
      total_salary,
      total_operating,
      period_label,
      by_category,
    };
  },
};
