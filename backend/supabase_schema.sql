-- =============================================================================
-- TorqueLine Motorcycle POS System - Supabase Schema
-- Compatible with Supabase PostgreSQL (Postgres 15+)
-- Run this script in the Supabase SQL Editor to initialize all tables & data
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    subcategories TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name);

-- 2. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    origin_country VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands (name);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    barcode_type VARCHAR(20) NOT NULL DEFAULT 'CODE128',
    category VARCHAR(100) NOT NULL DEFAULT 'Motorcycle Spare Parts',
    subcategory VARCHAR(100),
    brand VARCHAR(255) NOT NULL DEFAULT 'TorqueLine',
    product_type VARCHAR(50) NOT NULL DEFAULT 'standard',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    description TEXT,
    image_url TEXT,
    
    -- Pricing
    cost_price NUMERIC(12, 2) NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL,
    wholesale_price NUMERIC(12, 2),
    min_selling_price NUMERIC(12, 2),
    default_discount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- Inventory
    quantity INTEGER NOT NULL DEFAULT 0,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Pieces',
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    max_stock_level INTEGER,
    warehouse_location VARCHAR(100),
    rack_number VARCHAR(50),
    shelf_number VARCHAR(50),
    stock_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Supplier Information
    supplier_name VARCHAR(255),
    supplier_code VARCHAR(100),
    supplier_price NUMERIC(12, 2),
    preferred_supplier BOOLEAN NOT NULL DEFAULT false,
    estimated_delivery_days INTEGER,
    
    -- Motorcycle Compatibility & Fitment
    compatible_models TEXT,
    compatible_years VARCHAR(100),
    warranty_period VARCHAR(100),
    dimensions VARCHAR(100),
    weight VARCHAR(50),
    specifications TEXT,
    internal_notes TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    variations_json TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products (code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);

-- 4. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL,
    previous_quantity INTEGER NOT NULL,
    adjustment_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    user_name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements (product_id);

-- 5. PRODUCT ACTIVITY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.product_activities (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    user_name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_activities_product_id ON public.product_activities (product_id);

-- 6. SALES AND SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    cashier_name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    customer_name VARCHAR(100),
    customer_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales (invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales (sale_date);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items (sale_id);

-- 7. PURCHASES AND PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS public.purchases (
    id BIGSERIAL PRIMARY KEY,
    purchase_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_purchases_number ON public.purchases (purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases (supplier_name);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items (purchase_id);

-- 8. SUPPLIER PAYMENTS
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id BIGSERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    purchase_id BIGINT REFERENCES public.purchases(id) ON DELETE SET NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON public.supplier_payments (supplier_name);

-- =============================================================================
-- INITIAL DATA SEEDING (Run only if tables are empty)
-- =============================================================================

INSERT INTO public.categories (name, description) VALUES
    ('Braking System', 'Brake pads, discs, shoes, calipers, and master cylinders'),
    ('Oils & Lubricants', 'Engine oil, fork oil, chain lube, brake fluid, coolants'),
    ('Engine Parts', 'Pistons, rings, valves, gaskets, spark plugs, cam chains'),
    ('Electrical & Lighting', 'Headlamps, indicators, wiring harnesses, batteries, CDI'),
    ('Transmission & Clutch', 'Drive chains, sprockets, clutch plates, CVT drive belts'),
    ('Suspension & Steering', 'Front forks, rear shock absorbers, cone sets'),
    ('Tyres & Wheels', 'Tubeless tyres, tube tyres, alloy wheels, spokes'),
    ('Intake & Fuel System', 'Carburetors, fuel injectors, air filters, fuel pumps'),
    ('Body & Frame', 'Fairings, mudguards, mirrors, footpegs, crash guards'),
    ('Exhaust System', 'Exhaust pipes, mufflers, exhaust gaskets, heat shields')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.brands (name, origin_country, description) VALUES
    ('Brembo', 'Italy', 'High-performance braking systems'),
    ('Motul', 'France', 'Premium motor lubricants & fluids'),
    ('NGK', 'Japan', 'World leading spark plugs & ignition technology'),
    ('DID', 'Japan', 'Motorcycle drive chains & sprocket sets'),
    ('Honda Genuine', 'Japan', 'OEM Honda factory replacement parts'),
    ('Yamaha Genuine', 'Japan', 'OEM Yamaha factory parts & accessories'),
    ('Pirelli', 'Italy', 'Performance motorcycle tyres'),
    ('K&N', 'USA', 'High-flow washable air & oil filters'),
    ('Rolon', 'India', 'Heavy duty chain and sprocket kits'),
    ('TorqueLine', 'Sri Lanka', 'In-house tested motorcycle components')
ON CONFLICT (name) DO NOTHING;

