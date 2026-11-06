import { apiClient } from '../lib/api';
import type { FinancialSummary } from '../types/reports.types';

export const reportsService = {
  async getFinancialSummary(): Promise<FinancialSummary> {
    const { data } = await apiClient.get<FinancialSummary>('/reports/summary');
    return data;
  },
};

