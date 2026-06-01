import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { getTenantContextFromRequest } from "@/lib/tenant";
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

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContextFromRequest(request);
    const items = await fetchAdminCategories(tenantId);
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
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as CategoryBody;
    const category = normalizeCategory(body);

    if (!category.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const created = await insertCategory(category, tenantId);
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
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as CategoryBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    const category = normalizeCategory(body);

    if (!category.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updated = await updateCategory(id, category, tenantId);

    if (!updated) {
      return NextResponse.json({ error: "Category not found", status: 404 });
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
    const { tenantId } = await getTenantContextFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    await deleteCategory(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete category", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
