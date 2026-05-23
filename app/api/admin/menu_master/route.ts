import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getErrorMessage } from "@/lib/api";
import { demoMenuItems } from "@/lib/demo-store";
import type { MenuItem } from "@/types/cafe";

type MenuItemBody = Partial<Omit<MenuItem, "id">> & { id?: number | string };

function normalizeMenuItem(body: MenuItemBody): Omit<MenuItem, "id"> {
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
    if (!pool) {
      return NextResponse.json({ menuItems: demoMenuItems });
    }

    const { rows } = await pool.query(
      "SELECT id, name, description, price, category, image_url, is_available FROM menu_items ORDER BY id DESC"
    );
    return NextResponse.json({ menuItems: rows });
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

    if (!pool) {
      const item = demoMenuItems.find((entry) => entry.id === id);
      if (!item) {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }

      Object.assign(item, {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.description !== undefined ? { description: String(body.description).trim() } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
        ...(body.image_url !== undefined ? { image_url: String(body.image_url).trim() } : {}),
        ...(body.is_available !== undefined ? { is_available: Boolean(body.is_available) } : {}),
      });

      return NextResponse.json({ item });
    }

    const { rows } = await pool.query(
      `UPDATE menu_items
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           category = COALESCE($5, category),
           image_url = COALESCE($6, image_url),
           is_available = COALESCE($7, is_available)
       WHERE id = $1
       RETURNING id, name, description, price, category, image_url, is_available`,
      [
        id,
        body.name ?? null,
        body.description ?? null,
        body.price ?? null,
        body.category ?? null,
        body.image_url ?? null,
        body.is_available ?? null,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update menu master item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
