import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getErrorMessage } from "@/lib/api";
import { demoMenuItems } from "@/lib/demo-store";
import type { MenuItem } from "@/types/cafe";

type MenuItemBody = Partial<Omit<MenuItem, "id">> & { id?: number | string };

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ items: demoMenuItems });
    }

    const { rows } = await pool.query(
      "SELECT id, name, description, price, category, image_url, is_available FROM menu_items ORDER BY id DESC"
    );
    return NextResponse.json({ items: rows });
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

    if (!pool) {
      const created = { id: Date.now(), ...item };
      demoMenuItems.unshift(created);
      return NextResponse.json({ item: created }, { status: 201 });
    }

    const { rows } = await pool.query(
      `INSERT INTO menu_items (name, description, price, category, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category, image_url, is_available`,
      [item.name, item.description, item.price, item.category, item.image_url, item.is_available]
    );

    return NextResponse.json({ item: rows[0] }, { status: 201 });
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

    if (!pool) {
      const index = demoMenuItems.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }
      demoMenuItems[index] = { id, ...item };
      return NextResponse.json({ item: demoMenuItems[index] });
    }

    const { rows } = await pool.query(
      `UPDATE menu_items
       SET name = $2, description = $3, price = $4, category = $5, image_url = $6, is_available = $7
       WHERE id = $1
       RETURNING id, name, description, price, category, image_url, is_available`,
      [id, item.name, item.description, item.price, item.category, item.image_url, item.is_available]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: rows[0] });
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

    if (!pool) {
      const index = demoMenuItems.findIndex((entry) => entry.id === id);
      if (index >= 0) demoMenuItems.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    await pool.query("DELETE FROM menu_items WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete menu item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
