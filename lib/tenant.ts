import { createServerSupabaseClient } from "./supabase/server";

export type TenantRecord = {
  tenant_id: number;
  tenant_slug: string;
  tenant_name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  subscription_plan: string | null;
  status: number;
  created_at: string;
};

export async function getTenantBySlug(tenantSlug: string): Promise<TenantRecord | null> {
  const normalizedTenantSlug = tenantSlug.trim().toLowerCase();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tenants" as any)
    .select("tenant_id, tenant_slug, tenant_name, owner_name, email, phone, subscription_plan, status, created_at")
    .eq("tenant_slug", normalizedTenantSlug)
    .eq("status", 1)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as TenantRecord | null;
}

export async function getFirstActiveTenant(): Promise<TenantRecord | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tenants" as any)
    .select("tenant_id, tenant_slug, tenant_name, owner_name, email, phone, subscription_plan, status, created_at")
    .eq("status", 1)
    .order("tenant_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as TenantRecord | null;
}

export async function getTenantId(tenantSlug: string): Promise<number | null> {
  const tenant = await getTenantBySlug(tenantSlug);
  return tenant?.tenant_id ?? null;
}

export async function validateTenant(tenantSlug: string): Promise<TenantRecord> {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    throw new Error(`Tenant '${tenantSlug}' does not exist.`);
  }
  return tenant;
}

export function getTenantSlugFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? "";
}

export function buildTenantApiPath(route: string): string {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const tenantSlug = getTenantSlugFromPathname(pathname);
  if (!tenantSlug || tenantSlug === "admin" || tenantSlug === "super-admin") {
    throw new Error("Tenant slug is required to build tenant API path.");
  }
  const normalized = route.startsWith("/api/") ? route.replace(/^\/api\//, "") : route.replace(/^\//, "");
  return `/api/${tenantSlug}/${normalized}`.replace(/\/\/+/g, "/");
}

export async function getTenantContextFromRequest(request: Request) {
  const tenantId = Number(request.headers.get("x-tenant-id"));
  const tenantSlug = request.headers.get("x-tenant-slug");

  if (!tenantId || !tenantSlug) {
    throw new Error("Tenant context is missing from the request headers.");
  }

  return { tenantId, tenantSlug };
}

export function tenantApiFetch(route: string, init?: RequestInit) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  if (firstSegment === "admin" || firstSegment === "super-admin") {
    return fetch(route, init);
  }

  const tenantSlug = getTenantSlugFromPathname(pathname);
  if (!tenantSlug) {
    throw new Error("Tenant slug could not be resolved from browser pathname.");
  }

  const normalized = route.startsWith("/api/") ? route.replace(/^\/api\//, "") : route.replace(/^\//, "");
  return fetch(`/api/${tenantSlug}/${normalized}`, init);
}
