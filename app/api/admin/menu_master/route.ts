import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchAdminMenuItems, insertMenuItem, updateMenuItem } from "@/lib/supabase/crud";
import type { MenuItem } from "@/types/cafe";

type MenuItemBody = Partial<Omit<MenuItem, "id">> & { id?: number | string };

function normalizeMenuItem(body: MenuItemBody) {
  return {
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price || 0),
    category: String(body.category || "").trim(),
    image_url: String(body.image_url || "").trim(),
    is_available: Boolean(body.is_available ?? true),
  };
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const menuItems = await fetchAdminMenuItems();
    return NextResponse.json({ menuItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load menu master items", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MenuItemBody;
    const item = normalizeMenuItem(body);

    if (!item.name || !item.category || !item.price) {
      return NextResponse.json(
        { error: "Name, category, and price are required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const created = await insertMenuItem(item);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to save menu master item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as MenuItemBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Menu item id is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const updated = await updateMenuItem(id, {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.description !== undefined ? { description: String(body.description).trim() } : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
      ...(body.image_url !== undefined ? { image_url: String(body.image_url).trim() } : {}),
      ...(body.is_available !== undefined ? { is_available: Boolean(body.is_available) } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update menu master item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
