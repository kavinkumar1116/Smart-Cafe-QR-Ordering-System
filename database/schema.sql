CREATE DATABASE cafe_qr_db;

-- Run the statements below inside cafe_qr_db.


CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category INT REFERENCES categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cafe_tables (
  id SERIAL PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  qr_code_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  table_id INT REFERENCES cafe_tables(id),
  table_number INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(30) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  session_status VARCHAR(20) DEFAULT 'OPEN',
  payment_status VARCHAR(50) DEFAULT 'Pending',
  billing_method VARCHAR(50),
  order_type VARCHAR(50),
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id),
  quantity INT NOT NULL,
  price_at_time NUMERIC(10, 2) NOT NULL
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_status VARCHAR(20) DEFAULT 'OPEN';
ALTER TABLE orders ALTER COLUMN session_status SET DEFAULT 'OPEN';

UPDATE orders
SET table_number = cafe_tables.table_number
FROM cafe_tables
WHERE orders.table_number IS NULL
  AND orders.table_id = cafe_tables.id;

UPDATE orders
SET session_status = CASE
  WHEN payment_status = 'Paid' THEN 'CLOSED'
  ELSE 'OPEN'
END
WHERE session_status IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS one_open_order_session_per_table
ON orders (table_number)
WHERE session_status = 'OPEN';

INSERT INTO cafe_tables (table_number)
VALUES (1), (2), (3), (4)
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO menu_items (name, description, price, category, image_url, is_available)
VALUES
  ('Velvet Cappuccino', 'Double espresso, steamed milk, cocoa dust, and a tight microfoam finish.', 160, 'Coffee', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=80', true),
  ('Cold Brew Citrus', 'Slow-steeped arabica over ice with orange peel and a clean tonic sparkle.', 190, 'Coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80', true),
  ('Paneer Pesto Panini', 'Grilled paneer, basil pesto, peppers, and melted cheese in toasted focaccia.', 260, 'Food', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80', true),
  ('Smoky Veggie Burger', 'Spiced patty, lettuce, tomato, cheddar, and house relish on a toasted bun.', 280, 'Food', 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80', true),
  ('Chocolate Lava Cake', 'Warm chocolate cake with a molten center and vanilla cream.', 220, 'Dessert', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80', true),
  ('Berry Waffle Stack', 'Crisp waffles, berry compote, whipped cream, and maple drizzle.', 240, 'Dessert', 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=900&q=80', true);

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(40),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan VARCHAR(80) NOT NULL,
  status VARCHAR(80) DEFAULT 'trialing',
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (store_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission VARCHAR(160) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (role_id, permission)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, role_id, store_id, branch_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  scope VARCHAR(120) NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read categories" ON categories;
CREATE POLICY "public read categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "public manage categories" ON categories;
CREATE POLICY "public manage categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read menu items" ON menu_items;
CREATE POLICY "public read menu items" ON menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "public manage menu items" ON menu_items;
CREATE POLICY "public manage menu items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read cafe tables" ON cafe_tables;
CREATE POLICY "public read cafe tables" ON cafe_tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "public manage cafe tables" ON cafe_tables;
CREATE POLICY "public manage cafe tables" ON cafe_tables FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read orders" ON orders;
CREATE POLICY "public read orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "public create orders" ON orders;
CREATE POLICY "public create orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public update orders" ON orders;
CREATE POLICY "public update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public read order items" ON order_items;
CREATE POLICY "public read order items" ON order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "public create order items" ON order_items;
CREATE POLICY "public create order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public read app settings" ON app_settings;
CREATE POLICY "public read app settings" ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "public manage app settings" ON app_settings;
CREATE POLICY "public manage app settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated manage stores" ON stores;
CREATE POLICY "authenticated manage stores" ON stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated manage branches" ON branches;
CREATE POLICY "authenticated manage branches" ON branches FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated manage subscriptions" ON subscriptions;
CREATE POLICY "authenticated manage subscriptions" ON subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated manage roles" ON roles;
CREATE POLICY "authenticated manage roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated manage role permissions" ON role_permissions;
CREATE POLICY "authenticated manage role permissions" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated manage user roles" ON user_roles;
CREATE POLICY "authenticated manage user roles" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
