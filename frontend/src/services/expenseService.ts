import { apiClient } from '../lib/api';
import type {
  Expense,
  ExpenseCreateInput,
  ExpenseListResponse,
  ExpenseSummary,
  ExpenseUpdateInput,
} from '../types/expense.types';

const LOCAL_STORAGE_KEY = 'torqueline_expenses_cache';

function getLocalExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge legacy mock entries from previous sessions
        return parsed.filter(
          (e) => !(e.id <= 9 && (e.amount === 85000 || e.amount === 18450 || e.amount === 65000))
        );
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
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
        saveLocalExpenses(res.data.items);
        return res.data;
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
