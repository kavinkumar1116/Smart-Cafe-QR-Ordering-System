import { NextResponse } from "next/server";
import QRCode from "qrcode";
import pool from "@/lib/db";
import { getErrorMessage } from "@/lib/api";
import { demoTables } from "@/lib/demo-store";
import type { CafeTable } from "@/types/cafe";

export async function GET(request: Request) {
  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    let tables: CafeTable[] = demoTables;
    if (pool) {
      const { rows } = await pool.query(
        "SELECT id, table_number, qr_code_url FROM cafe_tables ORDER BY table_number"
      );
      tables = rows;
    }

    const qrCodes = await Promise.all(
      tables.map(async (table) => {
        const menuUrl = `${origin}/menu/${table.id}`;
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
