"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PublicTableName = keyof Database["public"]["Tables"];

interface UseRealtimeTableOptions {
  table: PublicTableName;
  onChange: () => void;
  enabled?: boolean;
}

export function useRealtimeTable({ table, onChange, enabled = true }: UseRealtimeTableOptions) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`public:${String(table)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: String(table) },
        () => onChange()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, onChange, table]);
}
