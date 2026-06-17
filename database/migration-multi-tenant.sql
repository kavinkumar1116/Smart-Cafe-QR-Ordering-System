-- Multi-tenant schema for Smart Cafe QR Ordering System
-- Shared database, shared schema approach.

CREATE DATABASE IF NOT EXISTS cafe_qr_db;

-- Tenant master table
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id BIGSERIAL PRIMARY KEY,
  tenant_slug VARCHAR(100) UNIQUE NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  subscription_plan VARCHAR(50),
  status SMALLINT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS subscription_plans  (
    id BIGSERIAL PRIMARY KEY,

    cafe_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    branch VARCHAR(255) NOT NULL,
    outlet_type VARCHAR(100) NOT NULL,
    tables VARCHAR(50) NOT NULL,

    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    state VARCHAR(100) NOT NULL,

    phone VARCHAR(15) NOT NULL,
    whatsapp VARCHAR(15),

    owner_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),

    email VARCHAR(255) NOT NULL UNIQUE,

    gst VARCHAR(15),
    fssai VARCHAR(14),

    plan VARCHAR(50) DEFAULT 'Free Trial',
    trial_days INTEGER DEFAULT 14,
    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  plan_key VARCHAR(50) NOT NULL REFERENCES subscription_plans(plan_key),
  status VARCHAR(50) DEFAULT 'trialing',
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tenant_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS cafe_tables (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (tenant_id, table_number)
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  table_id BIGINT NOT NULL REFERENCES cafe_tables(id),
  table_number INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(30) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  session_status VARCHAR(20) DEFAULT 'OPEN',
  payment_status VARCHAR(50) DEFAULT 'Pending',
  billing_method VARCHAR(50),
  order_type VARCHAR(50),
  total_amount NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL,
  price_at_time NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending',
  transaction_reference VARCHAR(255),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  table_id BIGINT NOT NULL REFERENCES cafe_tables(id) ON DELETE CASCADE,
  menu_url TEXT NOT NULL,
  qr_code_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kot_orders (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kitchen_status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  restaurant_name VARCHAR(255),
  logo_url TEXT,
  gst_number VARCHAR(80),
  currency VARCHAR(20) DEFAULT 'INR',
  theme VARCHAR(50),
  whatsapp_number VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Legacy store tables remain for compatibility and can be migrated later.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kot_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Example public read policies for shared tenant-aware public routes.
DROP POLICY IF EXISTS "public read tenants" ON tenants;
CREATE POLICY "public read tenants" ON tenants FOR SELECT USING (status = 1);
DROP POLICY IF EXISTS "public read categories" ON categories;
CREATE POLICY "public read categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "public read menu items" ON menu_items;
CREATE POLICY "public read menu items" ON menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "public read cafe tables" ON cafe_tables;
CREATE POLICY "public read cafe tables" ON cafe_tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "public read orders" ON orders;
CREATE POLICY "public read orders" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);
DROP POLICY IF EXISTS "public create orders" ON orders;
CREATE POLICY "public create orders" ON orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);
DROP POLICY IF EXISTS "public update orders" ON orders;
CREATE POLICY "public update orders" ON orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);
DROP POLICY IF EXISTS "public read order items" ON order_items;
CREATE POLICY "public read order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);
DROP POLICY IF EXISTS "public create order items" ON order_items;
CREATE POLICY "public create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);
