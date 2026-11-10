import { apiClient } from '../lib/api';
import type { FinancialSummary } from '../types/reports.types';

export const reportsService = {
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const { data } = await apiClient.get<FinancialSummary>('/financial/summary');
      if (data) {
        return data;
      }
    } catch {
      // Offline fallback
    }

    try {
      const { data } = await apiClient.get<FinancialSummary>('/reports/summary');
      if (data) {
        return data;
      }
    } catch {
      // Offline fallback
    }

    return {
      today_sales: 0.0,
      month_sales: 0.0,
      total_revenue: 0.0,
      total_cogs: 0.0,
      gross_profit: 0.0,
      total_operating_expenses: 0.0,
      total_salary_expenses: 0.0,
      total_expenses: 0.0,
      net_profit: 0.0,
      invoice_count_today: 0,
      invoice_count_month: 0,
    };
  },
};
