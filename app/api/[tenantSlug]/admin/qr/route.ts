import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchTables } from "@/lib/supabase/crud";
import type { CafeTable } from "@/types/cafe";

export async function GET(request: Request) {
  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantSlug, tenantId } = await getTenantContextFromRequest(request);
    const tables: CafeTable[] = await fetchTables(tenantId);

    const qrCodes = await Promise.all(
      tables.map(async (table) => {
        const menuUrl = `${origin}/${tenantSlug}/order/T${table.table_number}`;
        const qr_code_url = await QRCode.toDataURL(menuUrl, {
          margin: 2,
          width: 320,
          color: {
            dark: "#1e1714",
            light: "#fff8f0",
          },
        });
        return { ...table, menu_url: menuUrl, qr_code_url };
      })
    );

    return NextResponse.json({ qrCodes });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to generate QR codes", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
