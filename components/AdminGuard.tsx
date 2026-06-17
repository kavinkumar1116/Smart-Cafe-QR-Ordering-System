"use client";

import { useEffect, useState } from "react";
import { usePathname,useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ReactNode } from "react";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tenantSlug } = useParams(); // Get the tenantSlug from the URL
  const [ready, setReady] = useState(false);

 

  useEffect(() => {
    // Check your cookie or storage
    const isAuthenticated = document.cookie.includes("smart-cafe-admin=true"); // or localStorage
    
    if (!isAuthenticated) {
      // Dynamically redirect back to the tenant's login page
      router.replace(`/${tenantSlug}/admin`);
      return;
    }
    setReady(true);
  }, [router, tenantSlug]);

  if (!ready) return <div>Checking session...</div>;
  return children;
}

function getTenantAdminLoginPath(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const decodedSegment = decodeURIComponent(firstSegment);

  if (!decodedSegment || decodedSegment === "admin" || decodedSegment === "super-admin" || decodedSegment === "{tenantSlug}") {
    return "/admin";
  }

  return `/${decodedSegment}/admin`;
}
