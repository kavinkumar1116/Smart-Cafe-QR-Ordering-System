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
  customer_name VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(30) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
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
