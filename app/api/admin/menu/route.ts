import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { demoMenuItems } from "@/lib/demo-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { deleteMenuItem, fetchAdminMenuItems, insertMenuItem, updateMenuItem } from "@/lib/supabase/crud";
import type { MenuItem } from "@/types/cafe";

type MenuItemBody = Partial<Omit<MenuItem, "id">> & { id?: number | string };

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ items: demoMenuItems });
    }

    const items = await fetchAdminMenuItems();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load menu", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MenuItemBody;
    const item = {
      name: String(body.name || "").trim(),
      description: String(body.description || "").trim(),
      price: Number(body.price || 0),
      category: String(body.category || "Cafe").trim(),
      image_url: String(body.image_url || "").trim(),
      is_available: Boolean(body.is_available ?? true),
    };

    if (!item.name || !item.price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const created = { id: Date.now(), ...item, created_at: now, updated_at: now };
      demoMenuItems.unshift(created);
      return NextResponse.json({ item: created }, { status: 201 });
    }

    const created = await insertMenuItem(item);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create menu item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as MenuItemBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Menu item id is required" }, { status: 400 });
    }

    const item = {
      name: String(body.name || "").trim(),
      description: String(body.description || "").trim(),
      price: Number(body.price || 0),
      category: String(body.category || "Cafe").trim(),
      image_url: String(body.image_url || "").trim(),
      is_available: Boolean(body.is_available),
    };

    if (!isSupabaseConfigured()) {
      const index = demoMenuItems.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }
      demoMenuItems[index] = {
        ...demoMenuItems[index],
        ...item,
        id,
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ item: demoMenuItems[index] });
    }

    const updated = await updateMenuItem(id, item);

    if (!updated) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update menu item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Menu item id is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const index = demoMenuItems.findIndex((entry) => entry.id === id);
      if (index >= 0) demoMenuItems.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    await deleteMenuItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete menu item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
