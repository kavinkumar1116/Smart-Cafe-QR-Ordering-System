"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const AUTH_KEY = "smart-cafe-admin";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) !== "true") {
      router.replace("/admin");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="glass-panel rounded-lg p-8 text-center text-crema/70">Checking admin session...</div>;
  }

  return children;
}
