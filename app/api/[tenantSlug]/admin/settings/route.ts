import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import type { Json } from "@/types/database";

const SETTINGS_SCOPE = "restaurant";

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings" as any)
      .select("settings")
      .eq("scope", SETTINGS_SCOPE)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw error;

    const settingsRecord = data as { settings?: Json } | null;
    return NextResponse.json({ settings: settingsRecord?.settings || {} });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load settings", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as { settings?: Json };
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings" as any)
      .upsert(
        {
          scope: SETTINGS_SCOPE,
          tenant_id: tenantId,
          settings: body.settings || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scope,tenant_id" as any }
      )
      .select("settings")
      .single();

    if (error) throw error;

    const settingsRecord = data as unknown as { settings: Json };
    return NextResponse.json({ settings: settingsRecord.settings });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to save settings", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
