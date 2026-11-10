import { apiClient } from '../lib/api';
import type { DashboardResponse } from '../types/dashboard.types';

const DASHBOARD_CACHE_KEY = 'torqueline_dashboard_cache';

export const dashboardService = {
  /**
   * Fetches real-time dashboard metrics computed dynamically by the backend from database tables.
   */
  async getDashboardMetrics(): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get<DashboardResponse>('/dashboard/metrics');
      if (response.data && response.data.summary) {
        try {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(response.data));
        } catch {
          // ignore localStorage errors
        }
        return response.data;
      }
    } catch (error) {
      // Offline fallback: try reading from localStorage cache
      try {
        const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as DashboardResponse;
          if (parsed && parsed.summary) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
      throw error;
    }

    throw new Error('Failed to retrieve dashboard metrics from server');
  },
};
