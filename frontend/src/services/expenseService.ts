import { apiClient } from '../lib/api';
import type {
  Expense,
  ExpenseCreateInput,
  ExpenseListResponse,
  ExpenseSummary,
  ExpenseUpdateInput,
} from '../types/expense.types';

export const expenseService = {
  async getExpenses(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ExpenseListResponse> {
    const { data } = await apiClient.get<ExpenseListResponse>('/expenses', { params });
    return data;
  },

  async createExpense(input: ExpenseCreateInput): Promise<Expense> {
    const { data } = await apiClient.post<Expense>('/expenses', input);
    return data;
  },

  async updateExpense(id: number, input: ExpenseUpdateInput): Promise<Expense> {
    const { data } = await apiClient.patch<Expense>(`/expenses/${id}`, input);
    return data;
  },

  async deleteExpense(id: number): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },

  async getSummary(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<ExpenseSummary> {
    const { data } = await apiClient.get<ExpenseSummary>('/expenses/summary', { params });
    return data;
  },
};

