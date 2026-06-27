import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { deleteMenuItem, fetchAdminMenuItems, insertMenuItem, updateMenuItem } from "@/lib/supabase/crud";
import type { AdminMenuForm } from "@/types/cafe";
import { uploadBase64Image, deleteMenuImage } from "@/lib/supabase/storage";

type MenuBody = Partial<AdminMenuForm> & { id?: number | string };

function normalizeMenu(body: MenuBody) {
  return {
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price || 0),
    category: String(body.category || "").trim(),
    image_url: String(body.image_url || "").trim(),
    is_available: Boolean(body.is_available ?? true),
  };
}

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContextFromRequest(request);
    const items = await fetchAdminMenuItems(tenantId);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load menu items", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as MenuBody;

    const item = normalizeMenu(body);

    if (!item.name || !item.category || !item.price) {
      return NextResponse.json(
        {
          error: "Menu name, category, and price are required",
        },
        { status: 400 }
      );
    }

    // Step 1: Insert menu item first
    const created = await insertMenuItem(item, tenantId);

    // Step 2: Upload image if provided
    if (body.menuImageFile) {
      const imageUrl = await uploadBase64Image(
        body.menuImageFile,
        tenantId,
        created.id
      );

      // Step 3: Set image URL
      item.image_url = imageUrl;
    }

    // Step 4: Update the menu item with image_url
    const updated = await updateMenuItem(created.id, item, tenantId);

    if (!updated) {
      return NextResponse.json(
        { error: "Unable to update menu image." },
        { status: 500 }
      );
    }

    // Return updated record
    return NextResponse.json(
      { item: updated },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create menu item",
        detail: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as MenuBody;

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Menu id is required" },
        { status: 400 }
      );
    }

    const item = normalizeMenu(body);

    // Upload image only if a new image is provided
    if (body.menuImageFile) {
      const imageUrl = await uploadBase64Image(
        body.menuImageFile,
        tenantId,
        id
      );

      // Save the uploaded image URL
      item.image_url = imageUrl;
    }
    const updated = await updateMenuItem(id, item, tenantId);

    if (!updated) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update menu item",
        detail: getErrorMessage(error),
      },
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
      return NextResponse.json({ error: "Menu id is required" }, { status: 400 });
    }
    await deleteMenuImage(tenantId, id);
    await deleteMenuItem(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete menu item", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
