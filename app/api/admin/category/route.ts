import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { deleteCategory, fetchAdminCategories, insertCategory, updateCategory } from "@/lib/supabase/crud";
import type { Category } from "@/types/cafe";

type CategoryBody = Partial<Omit<Category, "id">> & { id?: number | string };

function normalizeCategory(body: CategoryBody) {
  return {
    name: String(body.name || "").trim(),
    image_url: String(body.image_url || "").trim(),
    is_available: Boolean(body.is_available ?? true),
  };
}

const demoCategories: Category[] = [];

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ items: demoCategories });
    }

    const items = await fetchAdminCategories();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load categories", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CategoryBody;
    const category = normalizeCategory(body);

    if (!category.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const created = { id: Date.now(), ...category, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      demoCategories.unshift(created);
      return NextResponse.json({ item: created }, { status: 201 });
    }

    const created = await insertCategory(category);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create category", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CategoryBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    const category = normalizeCategory(body);

    if (!category.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const index = demoCategories.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      demoCategories[index] = {
        ...demoCategories[index],
        ...category,
        id,
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ item: demoCategories[index] });
    }

    const updated = await updateCategory(id, category);

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update category", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const index = demoCategories.findIndex((entry) => entry.id === id);
      if (index >= 0) demoCategories.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete category", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
