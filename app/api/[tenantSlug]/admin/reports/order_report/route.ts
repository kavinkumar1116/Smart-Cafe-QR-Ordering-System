import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import {
  computeOrderReportSummary,
  enrichOrderForReport,
  type OrderReportFilters,
} from "@/lib/order-report";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchOrderReports } from "@/lib/supabase/crud";
import { getTenantContextFromRequest } from "@/lib/tenant";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as OrderReportFilters;

    const today = toDateInputValue(new Date());
    const filters: OrderReportFilters = {
      date_from: body.date_from || today,
      date_to: body.date_to || body.date_from || today,
      status: body.status?.trim() || "",
      table_number: body.table_number?.trim() || "",
      payment_method: body.payment_method?.trim() || "",
      customer_name: body.customer_name?.trim() || "",
      order_type: body.order_type?.trim() || "",
    };

    const orders = await fetchOrderReports(tenantId, filters);
    const report = orders.map(enrichOrderForReport);
    const summary = computeOrderReportSummary(report);

    return NextResponse.json({ report, summary });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load order reports",
        detail: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
