import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { demoMenuItems } from "@/lib/demo-store";
import { getErrorMessage } from "@/lib/api";

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ items: demoMenuItems });
    }

    const { rows } = await pool.query(
      "SELECT id, name, description, price, category, image_url, is_available FROM menu_items ORDER BY category, name"
    );
    return NextResponse.json({ items: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load menu items", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
