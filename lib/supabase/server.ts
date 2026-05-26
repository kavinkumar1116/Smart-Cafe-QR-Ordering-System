import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
