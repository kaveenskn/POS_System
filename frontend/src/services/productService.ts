import { apiClient } from '../lib/api';
import type {
  Product,
  ProductCreateInput,
  ProductListResponse,
} from '../types/product.types';

export const productService = {
  async getProducts(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<ProductListResponse> {
    const res = await apiClient.get<ProductListResponse>('/products', {
      params,
    });
    return res.data;
  },

  async getProduct(id: number): Promise<Product> {
    const res = await apiClient.get<Product>(`/products/${id}`);
    return res.data;
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    const res = await apiClient.post<Product>('/products', data);
    return res.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};

