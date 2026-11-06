export type ProductStatus = 'active' | 'inactive' | 'archived';
export type ProductType = 'standard' | 'variants' | 'service';
export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type BarcodeType = 'CODE128' | 'EAN13' | 'UPCA';

export interface ProductVariation {
  id: string;
  name: string;
  attribute_name: string;
  attribute_value: string;
  sku: string;
  barcode: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_stock_level: number;
  image_url?: string;
  status: ProductStatus;
}

export interface Product {
  id: number;
  name: string;
  code: string; // SKU
  barcode: string | null;
  barcode_type: BarcodeType;
  category: string;
  subcategory?: string | null;
  brand: string;
  product_type: ProductType;
  status: ProductStatus;
  description?: string | null;
  image_url?: string | null;

  // Pricing
  cost_price: number;
  selling_price: number;
  wholesale_price?: number | null;
  min_selling_price?: number | null;
  default_discount: number;
  tax_rate: number;

  // Inventory
  quantity: number;
  opening_stock: number;
  unit: string;
  min_stock_level: number;
  reorder_level: number;
  max_stock_level?: number | null;
  warehouse_location?: string | null;
  rack_number?: string | null;
  shelf_number?: string | null;
  stock_tracking_enabled: boolean;

  // Supplier
  supplier_name?: string | null;
  supplier_code?: string | null;
  supplier_price?: number | null;
  preferred_supplier: boolean;
  estimated_delivery_days?: number | null;

  // Motorcycle Fitment & Specs
  compatible_models?: string | null; // e.g. "Honda Dio, Honda Activa, Yamaha R15"
  compatible_years?: string | null;
  warranty_period?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  specifications?: string | null;
  internal_notes?: string | null;
  is_featured: boolean;
  variations_json?: string | null;

  created_at: string;
  updated_at: string;
}

export interface ProductCreateInput {
  name: string;
  code: string;
  barcode?: string | null;
  barcode_type?: BarcodeType;
  category: string;
  subcategory?: string | null;
  brand: string;
  product_type?: ProductType;
  status?: ProductStatus;
  description?: string | null;
  image_url?: string | null;

  cost_price: number;
  selling_price: number;
  wholesale_price?: number | null;
  min_selling_price?: number | null;
  default_discount?: number;
  tax_rate?: number;

  quantity?: number;
  opening_stock?: number;
  unit?: string;
  min_stock_level?: number;
  reorder_level?: number;
  max_stock_level?: number | null;
  warehouse_location?: string | null;
  rack_number?: string | null;
  shelf_number?: string | null;
  stock_tracking_enabled?: boolean;

  supplier_name?: string | null;
  supplier_code?: string | null;
  supplier_price?: number | null;
  preferred_supplier?: boolean;
  estimated_delivery_days?: number | null;

  compatible_models?: string | null;
  compatible_years?: string | null;
  warranty_period?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  specifications?: string | null;
  internal_notes?: string | null;
  is_featured?: boolean;
  variations_json?: string | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: string;
  previous_quantity: number;
  adjustment_quantity: number;
  new_quantity: number;
  reason: string;
  notes?: string | null;
  user_name: string;
  created_at: string;
}

export interface ProductActivity {
  id: number;
  product_id: number;
  action: string;
  details: string;
  user_name: string;
  created_at: string;
}

export interface ProductStatistics {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_value: number;
  categories_count: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  subcategories?: string | null;
}

export interface Brand {
  id: number;
  name: string;
  origin_country?: string | null;
  description?: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export interface StockAdjustmentInput {
  adjustment_type: 'increase' | 'decrease' | 'damaged' | 'lost' | 'correction';
  adjustment_quantity: number;
  reason: string;
  notes?: string;
  user_name?: string;
}
