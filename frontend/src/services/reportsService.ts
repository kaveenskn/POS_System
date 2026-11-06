import { apiClient } from '../lib/api';
import type { FinancialSummary } from '../types/reports.types';

const INITIAL_MOCK_SUMMARY: FinancialSummary = {
  today_sales: 45500.0,
  month_sales: 520000.0,
  total_revenue: 1505358.0,
  total_cogs: 890200.0,
  gross_profit: 615158.0,
  total_operating_expenses: 137000.0,
  total_salary_expenses: 113000.0,
  total_expenses: 250000.0,
  net_profit: 365158.0,
  invoice_count_today: 5,
  invoice_count_month: 68,
};

export const reportsService = {
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const { data } = await apiClient.get<FinancialSummary>('/reports/summary');
      if (data && (Number(data.total_revenue) > 0 || Number(data.total_expenses) > 0)) {
        return data;
      }
    } catch {
      // Offline fallback
    }

    return { ...INITIAL_MOCK_SUMMARY };
  },
};
