import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";

type ChannelKey = "Dine-in" | "Takeaway" | "Delivery";
type CountFilter = { column: "order_type" | "status"; value: string | string[] };

interface OrderAnalyticsRow {
  id: number;
  customer_mobile: string | null;
  customer_name: string | null;
  status: string | null;
  order_type: string | null;
  total_amount: number | string | null;
  created_at: string;
}

const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;
const DINE_IN_VALUES = ["Dine-in", "Dine-In"];
const COMPLETED_VALUES = ["Completed", "Served"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value: string | null): value is string {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return false;
  return toDateOnly(parseDateOnly(value)) === value;
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

function getTimestampDateKey(value: string): string {
  return value.slice(0, 10);
}

function getTimestampHour(value: string): number {
  const match = value.match(/[T\s](\d{2}):/);
  if (!match) return new Date(value).getHours();
  return Number(match[1]);
}

function formatDayLabel(value: string): string {
  const date = parseDateOnly(value);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getLastSevenDateBuckets(endDate: string) {
  const startDate = addDateOnlyDays(endDate, -6);
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = addDateOnlyDays(startDate, index);
    return {
      date,
      label: formatDayLabel(date),
      value: 0,
    };
  });

  return { startDate, buckets };
}

function sortRange(startDate: string, endDate: string) {
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

function isValidDateOrder(startDate: string, endDate: string): boolean {
  return parseDateOnly(startDate).getTime() <= parseDateOnly(endDate).getTime();
}

function normalizeChannel(orderType: string | null): ChannelKey {
  if (orderType === "Takeaway") return "Takeaway";
  if (orderType === "Delivery") return "Delivery";
  return "Dine-in";
}

async function countOrders(start: string, end: string, tenantId: number, filter?: CountFilter) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("orders" as any)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", start)
    .lt("created_at", end);

  if (filter) {
    query = Array.isArray(filter.value)
      ? query.in(filter.column, filter.value)
      : query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const { searchParams } = new URL(request.url);
    const requestedStartDate = searchParams.get("startDate");
    const requestedEndDate = searchParams.get("endDate");

    if (!isDateOnly(requestedStartDate) || !isDateOnly(requestedEndDate)) {
      return NextResponse.json({ error: "Valid YYYY-MM-DD startDate and endDate parameters are required" }, { status: 400 });
    }

    const { startDate, endDate } = sortRange(requestedStartDate, requestedEndDate);
    if (!isValidDateOrder(startDate, endDate)) {
      return NextResponse.json({ error: "Valid date range is required" }, { status: 400 });
    }

    const { start, endExclusive } = toDateRangeTimestamps(startDate, endDate);
    const revenueTrend = getLastSevenDateBuckets(endDate);
    const trendRange = toDateRangeTimestamps(revenueTrend.startDate, endDate);
    const supabase = createServerSupabaseClient();

    const [
      totalOrders,
      insideOrders,
      outsideOrders,
      pendingOrders,
      completedOrders,
      rangeRowsResult,
      trendRowsResult,
    ] = await Promise.all([
      countOrders(start, endExclusive, tenantId),
      countOrders(start, endExclusive, tenantId, { column: "order_type", value: DINE_IN_VALUES }),
      countOrders(start, endExclusive, tenantId, { column: "order_type", value: "Takeaway" }),
      countOrders(start, endExclusive, tenantId, { column: "status", value: "Pending" }),
      countOrders(start, endExclusive, tenantId, { column: "status", value: COMPLETED_VALUES }),
      supabase
        .from("orders" as any)
        .select("id, customer_mobile, customer_name, status, order_type, total_amount, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", start)
        .lt("created_at", endExclusive),
      supabase
        .from("orders" as any)
        .select("total_amount, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", trendRange.start)
        .lt("created_at", trendRange.endExclusive),
    ]);

    if (rangeRowsResult.error) throw new Error(rangeRowsResult.error.message);
    if (trendRowsResult.error) throw new Error(trendRowsResult.error.message);

    const rangeRows = (rangeRowsResult.data || []) as unknown as OrderAnalyticsRow[];
    const trendRows = (trendRowsResult.data || []) as unknown as Pick<OrderAnalyticsRow, "total_amount" | "created_at">[];
    const totalRevenue = rangeRows.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const customers = new Set(
      rangeRows.map((order) => order.customer_mobile || order.customer_name || String(order.id))
    ).size;

    const hourlySales = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, index) => {
      const hour = OPENING_HOUR + index;
      return {
        label: `${String(hour).padStart(2, "0")} :00`,
        value: 0,
      };
    });

    const channelComparison: Record<ChannelKey, number> = {
      "Dine-in": 0,
      Takeaway: 0,
      Delivery: 0,
    };

    for (const order of rangeRows) {
      const hour = getTimestampHour(order.created_at);
      if (hour >= OPENING_HOUR && hour < CLOSING_HOUR) {
        hourlySales[hour - OPENING_HOUR].value += Number(order.total_amount || 0);
      }

      channelComparison[normalizeChannel(order.order_type)] += 1;
    }

    const peak = hourlySales.reduce((best, item) => (item.value > best.value ? item : best), hourlySales[0]);
    const trendDays = revenueTrend.buckets;

    for (const order of trendRows) {
      const bucketKey = getTimestampDateKey(order.created_at);
      const bucket = trendDays.find((day) => day.date === bucketKey);
      if (bucket) bucket.value += Number(order.total_amount || 0);
    }

    return NextResponse.json({
      metrics: {
        totalOrders,
        totalRevenue,
        insideOrders,
        outsideOrders,
        pendingOrders,
        completedOrders,
        customerCount: customers,
        peakSalesTime: peak.label,
        peakSalesAmount: peak.value,
      },
      charts: {
        channelComparison: [
          { label: "Dine-in", value: channelComparison["Dine-in"], color: "#e2a13a" },
          { label: "Takeaway", value: channelComparison.Takeaway, color: "#6f8f57" },
          { label: "Delivery", value: channelComparison.Delivery, color: "#a53f5b" },
        ],
        hourlySales,
        revenueTrend: trendDays,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load dashboard analytics", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
