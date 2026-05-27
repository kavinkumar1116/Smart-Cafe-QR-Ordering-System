import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const SETTINGS_SCOPE = "restaurant";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("settings")
      .eq("scope", SETTINGS_SCOPE)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ settings: data?.settings || {} });
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

    const body = (await request.json()) as { settings?: Json };
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          scope: SETTINGS_SCOPE,
          settings: body.settings || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scope" }
      )
      .select("settings")
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data.settings });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to save settings", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
