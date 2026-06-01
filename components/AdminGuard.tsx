"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ReactNode } from "react";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const loginPath = getTenantAdminLoginPath(pathname);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        router.replace(loginPath);
        return;
      }

      setReady(true);
    }

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace(loginPath);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loginPath, router]);

  if (!ready) {
    return <div className="glass-panel rounded-lg p-8 text-center text-crema/70">Checking admin session...</div>;
  }

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
