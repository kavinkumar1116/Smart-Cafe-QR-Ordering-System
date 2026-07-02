import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value: string | null): value is string {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return false;
  return true;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDateOnlyDays(value: string, days: number): string {
  const next = parseDateOnly(value);
  next.setDate(next.getDate() + days);
  return toDateOnly(next);
}

function toDayStartTimestamp(value: string): string {
  return `${value} 00:00:00`;
}

function toDateRangeTimestamps(startDate: string, endDate: string) {
  return {
    start: toDayStartTimestamp(startDate),
    endExclusive: toDayStartTimestamp(addDateOnlyDays(endDate, 1)),
  };
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as {
      date_from?: string;
      date_to?: string;
    };

    const dateFrom = body.date_from || toDateOnly(new Date());
    const dateTo = body.date_to || dateFrom;

    if (!isDateOnly(dateFrom) || !isDateOnly(dateTo)) {
      return NextResponse.json({ error: "Valid YYYY-MM-DD date_from and date_to parameters are required" }, { status: 400 });
    }

    const { start, endExclusive } = toDateRangeTimestamps(dateFrom, dateTo);

    const supabase = createServerSupabaseClient();

    // Query orders with order items joined to menu items to get names
    const { data: orders, error: ordersError } = await supabase
      .from("orders" as any)
      .select(`
        id,
        order_id,
        total_amount,
        created_at,
        status,
        order_type,
        billing_method,
        payment_status,
        customer_name,
        customer_mobile,
        order_items:order_items (
          id,
          quantity,
          price_at_time,
          menu_items:menu_items (
            name
          )
        )
      `)
      .eq("tenant_id", tenantId)
      .gte("created_at", start)
      .lt("created_at", endExclusive);

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load revenue report details", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
