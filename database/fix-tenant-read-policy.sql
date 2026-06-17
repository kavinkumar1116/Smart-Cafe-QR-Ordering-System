DROP POLICY IF EXISTS "public read tenants" ON tenants;
CREATE POLICY "public read tenants" ON tenants FOR SELECT USING (status = 1);

DROP POLICY IF EXISTS "public insert tenants" ON tenants;
CREATE POLICY "public insert tenants" ON tenants FOR INSERT WITH CHECK (true);
