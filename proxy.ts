import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getFirstActiveTenant, getTenantBySlug } from "./lib/tenant";

const EXEMPT_PATHS = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/super-admin",
  "/api/auth",
  "/api/auth/",
  "/api/CreateNewAccout",
];

function shouldSkipPath(pathname: string) {
  return EXEMPT_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

function isTenantPlaceholder(segment: string) {
  const decodedSegment = decodeURIComponent(segment).toLowerCase();
  return decodedSegment === "{tenantslug}" || decodedSegment === ":tenantslug";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipPath(pathname)) {
    return NextResponse.next();
  }

  const segments = getPathSegments(pathname);
  if (segments.length === 0) {
    return NextResponse.next();
  }

  let tenantSlug = segments[0];

  if (pathname.startsWith("/api/")) {
    if (segments.length < 2) {
      return NextResponse.next();
    }
    tenantSlug = segments[1];
    if (tenantSlug === "admin" || tenantSlug === "orders") {
      return NextResponse.next();
    }
  }

  if (isTenantPlaceholder(tenantSlug)) {
    const defaultTenant = await getFirstActiveTenant();
    if (defaultTenant) {
      const redirectUrl = request.nextUrl.clone();
      segments[pathname.startsWith("/api/") ? 1 : 0] = defaultTenant.tenant_slug;
      redirectUrl.pathname = `/${segments.join("/")}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return new NextResponse("Tenant not found", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", String(tenant.tenant_id));
  requestHeaders.set("x-tenant-slug", tenant.tenant_slug);
  requestHeaders.set("x-tenant-name", tenant.tenant_name ?? "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|robots.txt).*)"],
};
