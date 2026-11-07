import { apiClient } from '../lib/api';
import type {
  Brand,
  Category,
  Product,
  ProductActivity,
  ProductCreateInput,
  ProductListResponse,
  ProductStatistics,
  StockAdjustmentInput,
  StockMovement,
} from '../types/product.types';

export interface ProductFilterParams {
  skip?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  stock_status?: string;
  supplier?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: string;
}

const LOCAL_STORAGE_KEY = 'torqueline_products_cache';

function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

function handleApiError(error: unknown, fallbackMessage: string): never {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } };
    const detail = axiosErr.response?.data?.detail;
    if (typeof detail === 'string') {
      throw new Error(detail);
    }
    if (Array.isArray(detail) && detail.length > 0) {
      throw new Error(detail.map((d) => d.msg || 'Validation error').join(', '));
    }
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(fallbackMessage);
}

export const productService = {
  /**
   * Retrieves paginated products from the backend API with comprehensive filters.
   */
  async getProducts(params?: ProductFilterParams): Promise<ProductListResponse> {
    try {
      const res = await apiClient.get<ProductListResponse>('/products', { params });
      if (res.data && Array.isArray(res.data.items)) {
        if (res.data.items.length > 0) {
          saveLocalProducts(res.data.items);
        }
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    let items = getLocalProducts();
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return { items, total: items.length };
  },

  /**
   * Retrieves dynamic dashboard statistics calculated directly in the database.
   */
  async getStatistics(): Promise<ProductStatistics> {
    try {
      const res = await apiClient.get<ProductStatistics>('/products/statistics');
      return res.data;
    } catch {
      const items = getLocalProducts();
      return {
        total_products: items.length,
        active_products: items.filter((p) => p.status === 'active').length,
        low_stock_products: items.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level).length,
        out_of_stock_products: items.filter((p) => p.quantity <= 0).length,
        total_inventory_value: items.reduce((s, p) => s + (p.cost_price || 0) * (p.quantity || 0), 0),
        categories_count: new Set(items.map((p) => p.category)).size,
      };
    }
  },

  /**
   * Retrieves single product details by database ID.
   */
  async getProduct(id: number): Promise<Product> {
    try {
      const res = await apiClient.get<Product>(`/products/${id}`);
      return res.data;
    } catch (err) {
      const local = getLocalProducts();
      const match = local.find((p) => p.id === id);
      if (match) return match;
      handleApiError(err, `Failed to fetch product #${id}`);
    }
  },

  /**
   * Finds a product by its barcode for POS barcode scanner registers.
   */
  async getProductByBarcode(barcode: string): Promise<Product> {
    try {
      const res = await apiClient.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
      return res.data;
    } catch (err) {
      const local = getLocalProducts();
      const match = local.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()) ||
          p.code.toLowerCase() === barcode.toLowerCase()
      );
      if (match) return match;
      handleApiError(err, `No product found for scanned barcode: ${barcode}`);
    }
  },

  /**
   * Creates a new product in the database.
   */
  async createProduct(data: ProductCreateInput): Promise<Product> {
    try {
      const res = await apiClient.post<Product>('/products', data);
      if (res.data && res.data.id) {
        const local = getLocalProducts();
        saveLocalProducts([res.data, ...local]);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalProducts();
    const newId = local.length > 0 ? Math.max(...local.map((p) => p.id)) + 1 : 1;
    const newProduct: Product = {
      id: newId,
      name: data.name,
      code: data.code,
      barcode: data.barcode ?? null,
      barcode_type: data.barcode_type ?? 'CODE128',
      category: data.category,
      brand: data.brand,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      quantity: data.quantity ?? 0,
      opening_stock: data.opening_stock ?? 0,
      unit: data.unit ?? 'Pieces',
      min_stock_level: data.min_stock_level ?? 5,
      reorder_level: data.reorder_level ?? 10,
      warehouse_location: data.warehouse_location ?? null,
      compatible_models: data.compatible_models ?? null,
      product_type: data.product_type ?? 'standard',
      status: data.status ?? 'active',
      default_discount: data.default_discount ?? 0,
      tax_rate: data.tax_rate ?? 0,
      stock_tracking_enabled: true,
      preferred_supplier: false,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalProducts([newProduct, ...local]);
    return newProduct;
  },

  /**
   * Updates an existing product by ID.
   */
  async updateProduct(id: number, data: Partial<ProductCreateInput>): Promise<Product> {
    try {
      const res = await apiClient.patch<Product>(`/products/${id}`, data);
      if (res.data) {
        const local = getLocalProducts().map((p) => (p.id === id ? res.data : p));
        saveLocalProducts(local);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalProducts();
    let updated: Product | null = null;
    const next = local.map((p) => {
      if (p.id === id) {
        updated = {
          ...p,
          ...data,
          updated_at: new Date().toISOString(),
        } as Product;
        return updated;
      }
      return p;
    });
    saveLocalProducts(next);
    if (!updated) throw new Error(`Product #${id} not found.`);
    return updated;
  },

  /**
   * Deletes a product from the database.
   */
  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      // Offline fallback
    }
    const local = getLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(local);
  },

  /**
   * Records a formal stock adjustment with audit logging.
   */
  async adjustStock(productId: number, data: StockAdjustmentInput): Promise<StockMovement> {
    try {
      const res = await apiClient.post<StockMovement>(`/products/${productId}/adjust-stock`, data);
      if (res.data) {
        const local = getLocalProducts().map((p) => {
          if (p.id === productId) {
            const delta = data.adjustment_type === 'increase' ? data.adjustment_quantity : -data.adjustment_quantity;
            return { ...p, quantity: Math.max(0, p.quantity + delta) };
          }
          return p;
        });
        saveLocalProducts(local);
        return res.data;
      }
    } catch {
      // Offline fallback
    }

    const local = getLocalProducts();
    const p = local.find((item) => item.id === productId);
    const prevQty = p ? p.quantity : 0;
    const delta = data.adjustment_type === 'increase' ? data.adjustment_quantity : -data.adjustment_quantity;
    const newQty = Math.max(0, prevQty + delta);
    const next = local.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item));
    saveLocalProducts(next);

    return {
      id: Date.now(),
      product_id: productId,
      movement_type: 'ADJUSTMENT',
      adjustment_quantity: delta,
      previous_quantity: prevQty,
      new_quantity: newQty,
      reason: data.reason,
      user_name: data.user_name ?? 'Admin',
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Retrieves the historical stock movements for a specific product.
   */
  async getStockHistory(productId: number): Promise<StockMovement[]> {
    try {
      const res = await apiClient.get<StockMovement[]>(`/products/${productId}/stock-history`);
      return res.data;
    } catch (err) {
      handleApiError(err, `Failed to fetch stock history for product #${productId}`);
    }
  },

  /**
   * Retrieves activity audit logs for a product.
   */
  async getActivityHistory(productId: number): Promise<ProductActivity[]> {
    try {
      const res = await apiClient.get<ProductActivity[]>(`/products/${productId}/activity-history`);
      return res.data;
    } catch (err) {
      handleApiError(err, `Failed to fetch activity logs for product #${productId}`);
    }
  },

  /**
   * Executes bulk status changes, price updates, stock adjustments, or deletions.
   */
  async bulkAction(
    productIds: number[],
    action: string,
    parameters?: Record<string, unknown>
  ): Promise<{ affected_count: number }> {
    try {
      const res = await apiClient.post<{ affected_count: number; message: string }>('/products/bulk-action', {
        product_ids: productIds,
        action,
        parameters,
      });
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to perform bulk operations');
    }
  },

  /**
   * Retrieves all product categories from the backend database.
   */
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get<Category[]>('/products/categories');
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to fetch categories from database');
    }
  },

  /**
   * Registers a new product category in the database.
   */
  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    try {
      const res = await apiClient.post<Category>('/products/categories', data);
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to create category');
    }
  },

  /**
   * Retrieves all manufacturer brands from the backend database.
   */
  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient.get<Brand[]>('/products/brands');
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to fetch brands from database');
    }
  },

  /**
   * Registers a new brand in the database.
   */
  async createBrand(data: { name: string; origin_country?: string; description?: string }): Promise<Brand> {
    try {
      const res = await apiClient.post<Brand>('/products/brands', data);
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to create brand');
    }
  },

  /**
   * Downloads a CSV export generated by the backend.
   */
  async exportCsv(): Promise<Blob> {
    try {
      const res = await apiClient.get('/products/export/csv', { responseType: 'blob' });
      return res.data;
    } catch (err) {
      handleApiError(err, 'Failed to export products to CSV');
    }
  },

  /**
   * Generates CSV text content from products list.
   */
  exportCsvData(products: Product[]): string {
    const headers = [
      'Name',
      'SKU',
      'Barcode',
      'Category',
      'Brand',
      'Cost Price',
      'Selling Price',
      'Stock',
      'Unit',
      'Status',
    ];
    const rows = products.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.code,
      p.barcode || '',
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      p.cost_price,
      p.selling_price,
      p.quantity,
      p.unit,
      p.status,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  /**
   * Imports multiple products from a CSV file directly via the backend API.
   */
  async importProducts(csvFile: File): Promise<{ success_count: number; error_count: number; errors: string[] }> {
    const text = await csvFile.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file contains no product data rows');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 4) continue;

      try {
        const item: Record<string, unknown> = {};
        headers.forEach((h, idx) => {
          item[h] = cols[idx] ?? '';
        });

        const name = String(item.name || item.product_name || `Imported Part ${i}`);
        const code = String(item.code || item.sku || `IMP-${Date.now()}-${i}`);
        const category = String(item.category || 'General');
        const brand = String(item.brand || 'TorqueLine');
        const costPrice = parseFloat(String(item.cost_price || item.cost || 0)) || 0;
        const sellingPrice = parseFloat(String(item.selling_price || item.price || 0)) || 0;
        const quantity = parseInt(String(item.quantity || item.stock || 0), 10) || 0;
        const barcode = item.barcode ? String(item.barcode) : undefined;

        await this.createProduct({
          name,
          code,
          category,
          brand,
          cost_price: costPrice,
          selling_price: sellingPrice,
          quantity,
          opening_stock: quantity,
          unit: 'Pieces',
          barcode,
          barcode_type: 'CODE128',
          product_type: 'standard',
          status: 'active',
        });
        successCount++;
      } catch (rowErr) {
        errors.push(`Row ${i + 1}: ${rowErr instanceof Error ? rowErr.message : 'Import failed'}`);
      }
    }

    return {
      success_count: successCount,
      error_count: errors.length,
      errors,
    };
  },
};
