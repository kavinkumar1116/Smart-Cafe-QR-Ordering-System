import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTenantBySlug } from "./lib/tenant";

const EXEMPT_PATHS = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/super-admin",
  "/api/auth",
  "/api/auth/",
];

function shouldSkipPath(pathname: string) {
  return EXEMPT_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

export async function middleware(request: NextRequest) {
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

  const tenant = await getTenantBySlug(tenantSlug);
  console.log("middleware tenant", { tenantSlug, tenant });

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
