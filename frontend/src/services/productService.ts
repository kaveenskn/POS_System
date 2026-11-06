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

const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Brembo Sintered Front Brake Pads',
    code: 'BRM-BP-001',
    barcode: '200109283741',
    barcode_type: 'CODE128',
    category: 'Braking System',
    subcategory: 'Brake Pads',
    brand: 'Brembo',
    product_type: 'standard',
    status: 'active',
    description: 'High performance sintered road and track front brake pads with superior thermal stability.',
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    cost_price: 1850.0,
    selling_price: 2650.0,
    wholesale_price: 2300.0,
    min_selling_price: 2100.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 18,
    opening_stock: 25,
    unit: 'Pairs',
    min_stock_level: 5,
    reorder_level: 10,
    max_stock_level: 50,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-04',
    shelf_number: 'S-02',
    stock_tracking_enabled: true,
    supplier_name: 'Brembo Auto & Moto Dist',
    supplier_code: 'SUP-BRM-88',
    supplier_price: 1850.0,
    preferred_supplier: true,
    estimated_delivery_days: 3,
    compatible_models: 'Yamaha R15, Yamaha MT-15, KTM Duke 200, KTM Duke 390, Honda CBR 250R',
    compatible_years: '2016-2024',
    warranty_period: '6 Months',
    specifications: 'Sintered friction compound, anti-vibration backing plate',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Motul 7100 4T 10W-40 100% Synthetic 1L',
    code: 'MOT-OIL-7100',
    barcode: '3374650247656',
    barcode_type: 'CODE128',
    category: 'Oils & Lubricants',
    subcategory: 'Engine Oil',
    brand: 'Motul',
    product_type: 'standard',
    status: 'active',
    description: '100% synthetic 4-Stroke motorcycle engine lubricant with Ester technology. Meets JASO MA2.',
    image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
    cost_price: 3800.0,
    selling_price: 4950.0,
    wholesale_price: 4400.0,
    min_selling_price: 4200.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 4, // low stock!
    opening_stock: 40,
    unit: 'Bottles',
    min_stock_level: 8,
    reorder_level: 15,
    max_stock_level: 100,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-01',
    shelf_number: 'S-01',
    stock_tracking_enabled: true,
    supplier_name: 'Ceylon Lubricants Ltd',
    supplier_code: 'SUP-MOT-01',
    supplier_price: 3800.0,
    preferred_supplier: true,
    estimated_delivery_days: 2,
    compatible_models: 'Universal 4-Stroke: Yamaha, Honda, Suzuki, Kawasaki, KTM, TVS, Bajaj',
    specifications: 'API SN / SM / SL, JASO MA2 Approved',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'NGK Iridium IX Spark Plug CR9EIX',
    code: 'NGK-SP-CR9EIX',
    barcode: '087295154489',
    barcode_type: 'CODE128',
    category: 'Electrical & Ignition',
    subcategory: 'Spark Plugs',
    brand: 'NGK',
    product_type: 'standard',
    status: 'active',
    description: 'High performance laser-welded iridium tipped center electrode for crisp throttle response.',
    image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    cost_price: 1100.0,
    selling_price: 1650.0,
    wholesale_price: 1400.0,
    min_selling_price: 1300.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 32,
    opening_stock: 50,
    unit: 'Pieces',
    min_stock_level: 10,
    reorder_level: 20,
    max_stock_level: 100,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-02',
    shelf_number: 'S-04',
    stock_tracking_enabled: true,
    supplier_name: 'Precision Spark Agencies',
    supplier_code: 'SUP-NGK-22',
    supplier_price: 1100.0,
    preferred_supplier: true,
    estimated_delivery_days: 4,
    compatible_models: 'Yamaha FZ-16, Yamaha FZS V2/V3, Yamaha R15 V2/V3/V4, Suzuki Gixxer 155',
    specifications: 'Thread: 10mm, Reach: 19mm, Hex: 16mm, Heat Range: 9',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'DID 520VX3 Pro-Street X-Ring Drive Chain 120L (Gold)',
    code: 'DID-CHN-520VX3',
    barcode: '4525516318259',
    barcode_type: 'CODE128',
    category: 'Drivetrain & Transmission',
    subcategory: 'Chains & Sprockets',
    brand: 'DID',
    product_type: 'standard',
    status: 'active',
    description: 'Sealed X-Ring drive chain engineered for high tensile strength and minimal friction loss.',
    cost_price: 14500.0,
    selling_price: 18900.0,
    wholesale_price: 17200.0,
    min_selling_price: 16500.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 0, // out of stock!
    opening_stock: 12,
    unit: 'Sets',
    min_stock_level: 3,
    reorder_level: 6,
    max_stock_level: 20,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-05',
    shelf_number: 'S-01',
    stock_tracking_enabled: true,
    supplier_name: 'Apex Drivetrain Imports',
    supplier_code: 'SUP-DID-09',
    supplier_price: 14500.0,
    preferred_supplier: true,
    estimated_delivery_days: 7,
    compatible_models: 'KTM Duke 250/390, Kawasaki Ninja 300/400, Yamaha MT-03, Honda CBR500R',
    specifications: 'Pitch: 520, Links: 120, Seal: X-Ring, Finish: Gold/Black',
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Honda Genuine Bando CVT Drive Belt',
    code: 'HON-CVT-BELT-01',
    barcode: '200492817263',
    barcode_type: 'CODE128',
    category: 'Scooter & Transmission',
    subcategory: 'Belts & Rollers',
    brand: 'Honda Genuine',
    product_type: 'standard',
    status: 'active',
    description: 'OEM replacement high-torque CVT transmission drive belt for Honda automatic scooters.',
    cost_price: 2200.0,
    selling_price: 3150.0,
    wholesale_price: 2800.0,
    min_selling_price: 2600.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 2, // low stock!
    opening_stock: 30,
    unit: 'Pieces',
    min_stock_level: 6,
    reorder_level: 12,
    max_stock_level: 40,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-03',
    shelf_number: 'S-02',
    stock_tracking_enabled: true,
    supplier_name: 'Stafford Motor Spares',
    supplier_code: 'SUP-HON-55',
    supplier_price: 2200.0,
    preferred_supplier: true,
    estimated_delivery_days: 2,
    compatible_models: 'Honda Dio 110, Honda Activa 110, Honda Grazia 125, Honda Navi',
    specifications: 'Kevlar reinforced aramid cord composite',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Pirelli Diablo Rosso III Rear Tyre 140/70-17',
    code: 'PIR-TYR-14070',
    barcode: '8019227263565',
    barcode_type: 'CODE128',
    category: 'Tyres & Wheels',
    subcategory: 'Tyres',
    brand: 'Pirelli',
    product_type: 'standard',
    status: 'active',
    description: 'Hypersport road tyre featuring dual-compound technology and racing groove tread design.',
    cost_price: 24500.0,
    selling_price: 31000.0,
    wholesale_price: 28500.0,
    min_selling_price: 27000.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 9,
    opening_stock: 15,
    unit: 'Pieces',
    min_stock_level: 4,
    reorder_level: 8,
    max_stock_level: 25,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'Tyre Bay',
    shelf_number: 'Bay-01',
    stock_tracking_enabled: true,
    supplier_name: 'Pirelli Tyre Lanka',
    supplier_code: 'SUP-PIR-99',
    supplier_price: 24500.0,
    preferred_supplier: true,
    estimated_delivery_days: 5,
    compatible_models: 'Yamaha R15 V3/V4, KTM Duke 200/250, Suzuki Gixxer SF 250, Honda CBR 150R',
    specifications: 'Size: 140/70 R17 M/C 66H TL, Bi-compound rear',
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'K&N High-Flow Performance Air Filter',
    code: 'KN-AIR-YA15',
    barcode: '024844360214',
    barcode_type: 'CODE128',
    category: 'Intake & Fuel System',
    subcategory: 'Air Filters',
    brand: 'K&N',
    product_type: 'standard',
    status: 'active',
    description: 'Washable and reusable multi-layer oiled cotton gauze filter engineered to increase airflow.',
    cost_price: 9200.0,
    selling_price: 12800.0,
    wholesale_price: 11400.0,
    min_selling_price: 10800.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 11,
    opening_stock: 15,
    unit: 'Pieces',
    min_stock_level: 3,
    reorder_level: 6,
    max_stock_level: 20,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-02',
    shelf_number: 'S-01',
    stock_tracking_enabled: true,
    supplier_name: 'Motor Performance Lanka',
    supplier_code: 'SUP-KN-12',
    supplier_price: 9200.0,
    preferred_supplier: false,
    estimated_delivery_days: 10,
    compatible_models: 'Yamaha YZF-R15 V3, Yamaha MT-15 155cc, Yamaha XSR 155',
    specifications: 'Cotton gauze media, million-mile limited warranty',
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Yamaha Genuine Spin-On Engine Oil Filter',
    code: 'YAM-OF-21C',
    barcode: '200881928374',
    barcode_type: 'CODE128',
    category: 'Oils & Lubricants',
    subcategory: 'Oil Filters',
    brand: 'Yamaha Genuine',
    product_type: 'standard',
    status: 'active',
    description: 'Factory original engine oil filter element with high efficiency micro-pore filtration media.',
    cost_price: 450.0,
    selling_price: 750.0,
    wholesale_price: 650.0,
    min_selling_price: 600.0,
    default_discount: 0,
    tax_rate: 0,
    quantity: 45,
    opening_stock: 60,
    unit: 'Pieces',
    min_stock_level: 15,
    reorder_level: 30,
    max_stock_level: 150,
    warehouse_location: 'Central Store Colombo',
    rack_number: 'R-01',
    shelf_number: 'S-04',
    stock_tracking_enabled: true,
    supplier_name: 'Associated Motorways (AMW)',
    supplier_code: 'SUP-YAM-01',
    supplier_price: 450.0,
    preferred_supplier: true,
    estimated_delivery_days: 2,
    compatible_models: 'Yamaha FZ 16, Yamaha FZS, Yamaha FZ-25, Yamaha R15 V1/V2/V3/V4, Yamaha MT-15',
    specifications: 'OEM Part No: 21C-E3440-00',
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Braking System', subcategories: 'Brake Pads, Brake Shoes, Discs, Calipers, Brake Fluid' },
  { id: 2, name: 'Oils & Lubricants', subcategories: 'Engine Oil, Gear Oil, Fork Oil, Chain Lube, Coolant, Oil Filters' },
  { id: 3, name: 'Electrical & Ignition', subcategories: 'Spark Plugs, Batteries, Regulators, Relays, Bulbs, CDI' },
  { id: 4, name: 'Drivetrain & Transmission', subcategories: 'Chains & Sprockets, Clutch Plates, Clutch Cables, Belts' },
  { id: 5, name: 'Tyres & Wheels', subcategories: 'Tyres, Tubes, Wheel Bearings, Rim Tapes' },
  { id: 6, name: 'Scooter & Transmission', subcategories: 'CVT Belts, Variator Rollers, Clutch Springs' },
  { id: 7, name: 'Intake & Fuel System', subcategories: 'Air Filters, Carburetors, Fuel Pumps, Jets' },
  { id: 8, name: 'Suspension & Steering', subcategories: 'Fork Seals, Monoshocks, Cone Sets, Handlebars' },
];

const INITIAL_BRANDS: Brand[] = [
  { id: 1, name: 'Brembo', origin_country: 'Italy' },
  { id: 2, name: 'Motul', origin_country: 'France' },
  { id: 3, name: 'NGK', origin_country: 'Japan' },
  { id: 4, name: 'DID', origin_country: 'Japan' },
  { id: 5, name: 'Honda Genuine', origin_country: 'Japan' },
  { id: 6, name: 'Yamaha Genuine', origin_country: 'Japan' },
  { id: 7, name: 'Pirelli', origin_country: 'Italy' },
  { id: 8, name: 'K&N', origin_country: 'USA' },
  { id: 9, name: 'Rolon', origin_country: 'India' },
  { id: 10, name: 'TorqueLine', origin_country: 'Sri Lanka' },
];

// Helper to manage persistent local storage
function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem('torqueline_products_db');
    if (!raw) {
      localStorage.setItem('torqueline_products_db', JSON.stringify(INITIAL_MOCK_PRODUCTS));
      return INITIAL_MOCK_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_PRODUCTS;
  }
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem('torqueline_products_db', JSON.stringify(products));
  } catch (err) {
    console.warn('Could not save products to local storage', err);
  }
}

function getLocalStockHistory(productId: number): StockMovement[] {
  try {
    const raw = localStorage.getItem(`torqueline_stock_history_${productId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [
    {
      id: 101,
      product_id: productId,
      movement_type: 'opening_stock',
      previous_quantity: 0,
      adjustment_quantity: 25,
      new_quantity: 25,
      reason: 'Initial Opening Stock setup',
      user_name: 'Admin',
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ];
}

function saveLocalStockMovement(productId: number, movement: StockMovement): void {
  const current = getLocalStockHistory(productId);
  current.unshift(movement);
  try {
    localStorage.setItem(`torqueline_stock_history_${productId}`, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export const productService = {
  async getProducts(params?: {
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
  }): Promise<ProductListResponse> {
    try {
      const res = await apiClient.get<ProductListResponse>('/products', { params });
      if (res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
        return res.data;
      }
    } catch {
      // Offline / fallback to rich local store
    }

    let items = [...getLocalProducts()];

    // Search filter
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.compatible_models && p.compatible_models.toLowerCase().includes(q)) ||
          (p.supplier_code && p.supplier_code.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (params?.category && params.category !== 'all') {
      items = items.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }

    // Brand filter
    if (params?.brand && params.brand !== 'all') {
      items = items.filter((p) => p.brand.toLowerCase() === params.brand!.toLowerCase());
    }

    // Status filter
    if (params?.status && params.status !== 'all') {
      items = items.filter((p) => p.status === params.status);
    }

    // Stock Status filter
    if (params?.stock_status && params.stock_status !== 'all') {
      if (params.stock_status === 'out_of_stock') {
        items = items.filter((p) => p.quantity <= 0);
      } else if (params.stock_status === 'low_stock') {
        items = items.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level);
      } else if (params.stock_status === 'in_stock') {
        items = items.filter((p) => p.quantity > p.min_stock_level);
      }
    }

    // Price range
    if (params?.min_price !== undefined) {
      items = items.filter((p) => p.selling_price >= params.min_price!);
    }
    if (params?.max_price !== undefined) {
      items = items.filter((p) => p.selling_price <= params.max_price!);
    }

    // Sorting
    const sortField = params?.sort_by || 'created_at';
    const isAsc = params?.sort_order === 'asc';
    items.sort((a, b) => {
      let valA: unknown = (a as unknown as Record<string, unknown>)[sortField] ?? '';
      let valB: unknown = (b as unknown as Record<string, unknown>)[sortField] ?? '';
      if (typeof valA === 'string') valA = (valA as string).toLowerCase();
      if (typeof valB === 'string') valB = (valB as string).toLowerCase();
      if ((valA as string | number) < (valB as string | number)) return isAsc ? -1 : 1;
      if ((valA as string | number) > (valB as string | number)) return isAsc ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginated = items.slice(skip, skip + limit);

    return { items: paginated, total };
  },

  async getStatistics(): Promise<ProductStatistics> {
    try {
      const res = await apiClient.get<ProductStatistics>('/products/statistics');
      if (res.data) return res.data;
    } catch {
      // offline fallback
    }

    const items = getLocalProducts();
    const total = items.length;
    const active = items.filter((p) => p.status === 'active').length;
    const low = items.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock_level).length;
    const out = items.filter((p) => p.quantity <= 0).length;
    const totalVal = items.reduce((sum, p) => sum + p.quantity * p.cost_price, 0);
    const catSet = new Set(items.map((p) => p.category));

    return {
      total_products: total,
      active_products: active,
      low_stock_products: low,
      out_of_stock_products: out,
      total_inventory_value: totalVal,
      categories_count: catSet.size,
    };
  },

  async getProduct(id: number): Promise<Product> {
    try {
      const res = await apiClient.get<Product>(`/products/${id}`);
      return res.data;
    } catch {
      const found = getLocalProducts().find((p) => p.id === id);
      if (!found) throw new Error('Product not found');
      return found;
    }
  },

  async getProductByBarcode(barcode: string): Promise<Product> {
    try {
      const res = await apiClient.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
      return res.data;
    } catch {
      const found = getLocalProducts().find(
        (p) => p.barcode === barcode || p.code.toLowerCase() === barcode.toLowerCase()
      );
      if (!found) throw new Error('No product found for scanned barcode');
      return found;
    }
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    try {
      const res = await apiClient.post<Product>('/products', data);
      return res.data;
    } catch {
      // Offline fallback
      const prods = getLocalProducts();
      if (prods.some((p) => p.code.toLowerCase() === data.code.toLowerCase())) {
        throw new Error(`Product with SKU '${data.code}' already exists`);
      }
      if (data.barcode && prods.some((p) => p.barcode === data.barcode)) {
        throw new Error(`Product with barcode '${data.barcode}' already exists`);
      }
      const newProduct: Product = {
        ...data,
        id: Date.now(),
        barcode: data.barcode || null,
        barcode_type: data.barcode_type || 'CODE128',
        product_type: data.product_type || 'standard',
        status: data.status || 'active',
        quantity: data.quantity ?? 0,
        opening_stock: data.opening_stock ?? 0,
        unit: data.unit || 'Pieces',
        min_stock_level: data.min_stock_level ?? 5,
        reorder_level: data.reorder_level ?? 10,
        default_discount: data.default_discount ?? 0,
        tax_rate: data.tax_rate ?? 0,
        preferred_supplier: data.preferred_supplier ?? false,
        is_featured: data.is_featured ?? false,
        stock_tracking_enabled: data.stock_tracking_enabled ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      prods.unshift(newProduct);
      saveLocalProducts(prods);

      if (newProduct.quantity > 0) {
        saveLocalStockMovement(newProduct.id, {
          id: Date.now(),
          product_id: newProduct.id,
          movement_type: 'opening_stock',
          previous_quantity: 0,
          adjustment_quantity: newProduct.quantity,
          new_quantity: newProduct.quantity,
          reason: 'Initial Opening Stock setup',
          user_name: 'Admin',
          created_at: new Date().toISOString(),
        });
      }

      return newProduct;
    }
  },

  async updateProduct(id: number, data: Partial<ProductCreateInput>): Promise<Product> {
    try {
      const res = await apiClient.patch<Product>(`/products/${id}`, data);
      return res.data;
    } catch {
      const prods = getLocalProducts();
      const idx = prods.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Product not found');

      if (data.code && prods.some((p) => p.id !== id && p.code.toLowerCase() === data.code!.toLowerCase())) {
        throw new Error(`Product with SKU '${data.code}' already exists`);
      }
      if (data.barcode && prods.some((p) => p.id !== id && p.barcode === data.barcode)) {
        throw new Error(`Product with barcode '${data.barcode}' already exists`);
      }

      const updated = {
        ...prods[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      prods[idx] = updated;
      saveLocalProducts(prods);
      return updated;
    }
  },

  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      const prods = getLocalProducts().filter((p) => p.id !== id);
      saveLocalProducts(prods);
    }
  },

  async adjustStock(productId: number, data: StockAdjustmentInput): Promise<StockMovement> {
    try {
      const res = await apiClient.post<StockMovement>(`/products/${productId}/adjust-stock`, data);
      return res.data;
    } catch {
      const prods = getLocalProducts();
      const idx = prods.findIndex((p) => p.id === productId);
      if (idx === -1) throw new Error('Product not found');

      const prevQty = prods[idx].quantity;
      let newQty = prevQty;
      let change = data.adjustment_quantity;

      if (data.adjustment_type === 'increase') {
        newQty = prevQty + data.adjustment_quantity;
        change = data.adjustment_quantity;
      } else if (['decrease', 'damaged', 'lost'].includes(data.adjustment_type)) {
        newQty = Math.max(0, prevQty - data.adjustment_quantity);
        change = -data.adjustment_quantity;
      } else if (data.adjustment_type === 'correction') {
        newQty = Math.max(0, data.adjustment_quantity);
        change = newQty - prevQty;
      }

      prods[idx].quantity = newQty;
      saveLocalProducts(prods);

      const movement: StockMovement = {
        id: Date.now(),
        product_id: productId,
        movement_type: data.adjustment_type,
        previous_quantity: prevQty,
        adjustment_quantity: change,
        new_quantity: newQty,
        reason: data.reason,
        notes: data.notes,
        user_name: data.user_name || 'Admin',
        created_at: new Date().toISOString(),
      };

      saveLocalStockMovement(productId, movement);
      return movement;
    }
  },

  async getStockHistory(productId: number): Promise<StockMovement[]> {
    try {
      const res = await apiClient.get<StockMovement[]>(`/products/${productId}/stock-history`);
      return res.data;
    } catch {
      return getLocalStockHistory(productId);
    }
  },

  async getActivityHistory(productId: number): Promise<ProductActivity[]> {
    try {
      const res = await apiClient.get<ProductActivity[]>(`/products/${productId}/activity-history`);
      return res.data;
    } catch {
      return [
        {
          id: 1,
          product_id: productId,
          action: 'CREATED',
          details: 'Product registered in inventory catalog.',
          user_name: 'Admin',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ];
    }
  },

  async bulkAction(
    productIds: number[],
    action: string,
    parameters?: Record<string, unknown>
  ): Promise<{ affected_count: number }> {
    try {
      const res = await apiClient.post('/products/bulk-action', {
        product_ids: productIds,
        action,
        parameters,
      });
      return res.data;
    } catch {
      const prods = getLocalProducts();
      let affected = 0;
      for (const p of prods) {
        if (productIds.includes(p.id)) {
          if (action === 'activate') {
            p.status = 'active';
            affected++;
          } else if (action === 'deactivate') {
            p.status = 'inactive';
            affected++;
          } else if (action === 'archive') {
            p.status = 'archived';
            affected++;
          } else if (action === 'update_price' && parameters) {
            if (parameters.selling_price) p.selling_price = parseFloat(String(parameters.selling_price));
            if (parameters.cost_price) p.cost_price = parseFloat(String(parameters.cost_price));
            affected++;
          } else if (action === 'adjust_stock' && parameters) {
            const diff = parseInt(String(parameters.quantity_change), 10) || 0;
            p.quantity = Math.max(0, p.quantity + diff);
            affected++;
          }
        }
      }
      if (action === 'delete') {
        const remaining = prods.filter((p) => !productIds.includes(p.id));
        saveLocalProducts(remaining);
        return { affected_count: productIds.length };
      }
      saveLocalProducts(prods);
      return { affected_count: affected };
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get<Category[]>('/products/categories');
      if (res.data && res.data.length) return res.data;
    } catch {
      // offline
    }
    return INITIAL_CATEGORIES;
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient.get<Brand[]>('/products/brands');
      if (res.data && res.data.length) return res.data;
    } catch {
      // offline
    }
    return INITIAL_BRANDS;
  },

  exportCsvData(products: Product[]): string {
    const headers = [
      'ID',
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Subcategory',
      'Brand',
      'Cost Price (LKR)',
      'Selling Price (LKR)',
      'Quantity',
      'Unit',
      'Stock Status',
      'Status',
      'Compatible Models',
    ];

    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.code,
      p.barcode || '',
      `"${p.category}"`,
      `"${p.subcategory || ''}"`,
      `"${p.brand}"`,
      p.cost_price,
      p.selling_price,
      p.quantity,
      p.unit,
      p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.min_stock_level ? 'Low Stock' : 'In Stock',
      p.status,
      `"${(p.compatible_models || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
