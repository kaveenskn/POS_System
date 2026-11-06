export interface Product {
  id: number;
  name: string;
  code: string;
  brand: string;
  cost_price: number;
  selling_price: number;
  description?: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateInput {
  name: string;
  code: string;
  brand: string;
  cost_price: number;
  selling_price: number;
  description?: string;
  quantity?: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

