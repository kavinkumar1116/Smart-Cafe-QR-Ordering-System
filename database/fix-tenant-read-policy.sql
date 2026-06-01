DROP POLICY IF EXISTS "public read tenants" ON tenants;
CREATE POLICY "public read tenants" ON tenants FOR SELECT USING (status = 1);
