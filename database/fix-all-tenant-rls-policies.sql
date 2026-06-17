-- Run this in Supabase SQL Editor after the multi-tenant tables exist.
-- It gives the public anon client tenant-scoped access for this app's
-- customer ordering and admin CRUD screens.

DROP POLICY IF EXISTS "public read tenants" ON tenants;
CREATE POLICY "public read tenants" ON tenants
FOR SELECT USING (status = 1);

DROP POLICY IF EXISTS "public insert tenants" ON tenants;
CREATE POLICY "public insert tenants" ON tenants
FOR INSERT WITH CHECK (true);

-- Categories
DROP POLICY IF EXISTS "public read categories" ON categories;
CREATE POLICY "public read categories" ON categories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = categories.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert categories" ON categories;
DROP POLICY IF EXISTS "public manage categories" ON categories;
CREATE POLICY "public insert categories" ON categories
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = categories.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update categories" ON categories;
CREATE POLICY "public update categories" ON categories
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = categories.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = categories.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public delete categories" ON categories;
CREATE POLICY "public delete categories" ON categories
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = categories.tenant_id
      AND tenants.status = 1
  )
);

-- Menu items
DROP POLICY IF EXISTS "public read menu items" ON menu_items;
CREATE POLICY "public read menu items" ON menu_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = menu_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert menu items" ON menu_items;
DROP POLICY IF EXISTS "public manage menu items" ON menu_items;
CREATE POLICY "public insert menu items" ON menu_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = menu_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update menu items" ON menu_items;
CREATE POLICY "public update menu items" ON menu_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = menu_items.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = menu_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public delete menu items" ON menu_items;
CREATE POLICY "public delete menu items" ON menu_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = menu_items.tenant_id
      AND tenants.status = 1
  )
);

-- Cafe tables
DROP POLICY IF EXISTS "public read cafe tables" ON cafe_tables;
CREATE POLICY "public read cafe tables" ON cafe_tables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = cafe_tables.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert cafe tables" ON cafe_tables;
DROP POLICY IF EXISTS "public manage cafe tables" ON cafe_tables;
CREATE POLICY "public insert cafe tables" ON cafe_tables
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = cafe_tables.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update cafe tables" ON cafe_tables;
CREATE POLICY "public update cafe tables" ON cafe_tables
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = cafe_tables.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = cafe_tables.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public delete cafe tables" ON cafe_tables;
CREATE POLICY "public delete cafe tables" ON cafe_tables
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = cafe_tables.tenant_id
      AND tenants.status = 1
  )
);

-- Orders
DROP POLICY IF EXISTS "public read orders" ON orders;
CREATE POLICY "public read orders" ON orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public create orders" ON orders;
DROP POLICY IF EXISTS "public insert orders" ON orders;
CREATE POLICY "public insert orders" ON orders
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update orders" ON orders;
CREATE POLICY "public update orders" ON orders
FOR UPDATE USING (
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

DROP POLICY IF EXISTS "public delete orders" ON orders;
CREATE POLICY "public delete orders" ON orders
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = orders.tenant_id
      AND tenants.status = 1
  )
);

-- Order items
DROP POLICY IF EXISTS "public read order items" ON order_items;
CREATE POLICY "public read order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public create order items" ON order_items;
DROP POLICY IF EXISTS "public insert order items" ON order_items;
CREATE POLICY "public insert order items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update order items" ON order_items;
CREATE POLICY "public update order items" ON order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public delete order items" ON order_items;
CREATE POLICY "public delete order items" ON order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = order_items.tenant_id
      AND tenants.status = 1
  )
);

-- Customers
DROP POLICY IF EXISTS "public read customers" ON customers;
CREATE POLICY "public read customers" ON customers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = customers.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert customers" ON customers;
CREATE POLICY "public insert customers" ON customers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = customers.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update customers" ON customers;
CREATE POLICY "public update customers" ON customers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = customers.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = customers.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public delete customers" ON customers;
CREATE POLICY "public delete customers" ON customers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = customers.tenant_id
      AND tenants.status = 1
  )
);

-- App settings
-- CREATE UNIQUE INDEX IF NOT EXISTS app_settings
-- ON app_settings (tenant_id, scope);

DROP POLICY IF EXISTS "public read app settings" ON app_settings;
CREATE POLICY "public read app settings" ON app_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = app_settings.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert app settings" ON app_settings;
DROP POLICY IF EXISTS "public manage app settings" ON app_settings;
CREATE POLICY "public insert app settings" ON app_settings
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = app_settings.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update app settings" ON app_settings;
CREATE POLICY "public update app settings" ON app_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = app_settings.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = app_settings.tenant_id
      AND tenants.status = 1
  )
);

-- Optional tables from the multi-tenant schema.
DROP POLICY IF EXISTS "public read payments" ON payments;
CREATE POLICY "public read payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = payments.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert payments" ON payments;
CREATE POLICY "public insert payments" ON payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = payments.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update payments" ON payments;
CREATE POLICY "public update payments" ON payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = payments.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = payments.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public read qr codes" ON qr_codes;
CREATE POLICY "public read qr codes" ON qr_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = qr_codes.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert qr codes" ON qr_codes;
CREATE POLICY "public insert qr codes" ON qr_codes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = qr_codes.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update qr codes" ON qr_codes;
CREATE POLICY "public update qr codes" ON qr_codes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = qr_codes.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = qr_codes.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public read kot orders" ON kot_orders;
CREATE POLICY "public read kot orders" ON kot_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = kot_orders.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public insert kot orders" ON kot_orders;
CREATE POLICY "public insert kot orders" ON kot_orders
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = kot_orders.tenant_id
      AND tenants.status = 1
  )
);

DROP POLICY IF EXISTS "public update kot orders" ON kot_orders;
CREATE POLICY "public update kot orders" ON kot_orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = kot_orders.tenant_id
      AND tenants.status = 1
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.tenant_id = kot_orders.tenant_id
      AND tenants.status = 1
  )
);
