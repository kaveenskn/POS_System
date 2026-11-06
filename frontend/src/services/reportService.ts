import { apiClient } from '../lib/api';
import type {
  CurrentStockReportResponse,
  LowStockReportResponse,
  OutOfStockReportResponse,
  PurchaseByProductResponse,
  PurchaseBySupplierResponse,
  PurchaseHistoryResponse,
  ReportOverviewResponse,
  SalesReportResponse,
  SupplierPaymentResponse,
} from '../types/report.types';

export const reportService = {
  /**
   * Fetches high-level executive dashboard overview metrics computed by backend.
   */
  async getOverview(
    period: string = 'this_month',
    startDate?: string,
    endDate?: string
  ): Promise<ReportOverviewResponse> {
    const res = await apiClient.get<ReportOverviewResponse>('/reports/overview', {
      params: {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Sales Report for Daily, Weekly, Monthly, Yearly, or Custom range.
   */
  async getSalesReport(
    period: string = 'daily',
    startDate?: string,
    endDate?: string
  ): Promise<SalesReportResponse> {
    const res = await apiClient.get<SalesReportResponse>('/reports/sales', {
      params: {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Current Stock Report with category & name filter.
   */
  async getCurrentStockReport(
    category?: string,
    search?: string
  ): Promise<CurrentStockReportResponse> {
    const res = await apiClient.get<CurrentStockReportResponse>('/reports/inventory/current-stock', {
      params: {
        category: category && category !== 'all' ? category : undefined,
        search: search && search.trim() ? search.trim() : undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Low Stock Alert Report.
   */
  async getLowStockReport(
    category?: string,
    search?: string
  ): Promise<LowStockReportResponse> {
    const res = await apiClient.get<LowStockReportResponse>('/reports/inventory/low-stock', {
      params: {
        category: category && category !== 'all' ? category : undefined,
        search: search && search.trim() ? search.trim() : undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Out of Stock Products Report.
   */
  async getOutOfStockReport(
    category?: string,
    search?: string
  ): Promise<OutOfStockReportResponse> {
    const res = await apiClient.get<OutOfStockReportResponse>('/reports/inventory/out-of-stock', {
      params: {
        category: category && category !== 'all' ? category : undefined,
        search: search && search.trim() ? search.trim() : undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Purchase by Supplier summary.
   */
  async getPurchasesBySupplier(
    period: string = 'this_year',
    startDate?: string,
    endDate?: string
  ): Promise<PurchaseBySupplierResponse> {
    const res = await apiClient.get<PurchaseBySupplierResponse>('/reports/purchases/by-supplier', {
      params: {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Purchase by Product report.
   */
  async getPurchasesByProduct(
    period: string = 'this_year',
    startDate?: string,
    endDate?: string
  ): Promise<PurchaseByProductResponse> {
    const res = await apiClient.get<PurchaseByProductResponse>('/reports/purchases/by-product', {
      params: {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Purchase History records.
   */
  async getPurchaseHistory(
    period: string = 'this_year',
    startDate?: string,
    endDate?: string
  ): Promise<PurchaseHistoryResponse> {
    const res = await apiClient.get<PurchaseHistoryResponse>('/reports/purchases/history', {
      params: {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return res.data;
  },

  /**
   * Fetches Supplier Payments and balances.
   */
  async getSupplierPayments(): Promise<SupplierPaymentResponse> {
    const res = await apiClient.get<SupplierPaymentResponse>('/reports/purchases/supplier-payments');
    return res.data;
  },
};

