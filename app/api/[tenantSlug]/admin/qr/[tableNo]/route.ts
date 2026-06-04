import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTenantContextFromRequest } from "@/lib/tenant";
import {
  fetchCategories,
  fetchMenuItems,
  fetchTableByNumber,
  getRestaurantDetails,
} from "@/lib/supabase/crud";

type RouteContext = {
  params: Promise<{ tableNo: string }>;
};

function parseTableNumber(rawTableNo: string): number | null {
  const normalized = rawTableNo.trim().replace(/^T/i, "");
  const tableNumber = Number(normalized);

  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    return null;
  }

  return tableNumber;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, message: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { tableNo: rawTableNo } = await context.params;
    const { tenantId } = await getTenantContextFromRequest(request);

    const tableNumber = parseTableNumber(rawTableNo);
    if (tableNumber === null) {
      return NextResponse.json(
        { success: false, message: "Invalid table number" },
        { status: 400 }
      );
    }

    const restaurantDetails = await getRestaurantDetails(tenantId);

    const table = await fetchTableByNumber(tableNumber, tenantId);
    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table Number Not Found" },
        { status: 404 }
      );
    }

    const [category, allMenuItems] = await Promise.all([
      fetchCategories(tenantId),
      fetchMenuItems(tenantId),
    ]);

    const menuItems = allMenuItems.filter((item) => item.is_available);

    return NextResponse.json({
      success: true,
      restaurantDetails: restaurantDetails[0] || null,
      tableNo: String(tableNumber),
      category,
      menuItems,
    });
  } catch (error) {
    const detail = getErrorMessage(error);

    if (detail.includes("Tenant context is missing")) {
      return NextResponse.json(
        { success: false, message: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to load menu", detail },
      { status: 500 }
    );
  }
}
