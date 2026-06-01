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
