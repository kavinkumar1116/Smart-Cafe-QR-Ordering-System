import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchAdminSalesReports, getOrderSalesReportByDate } from "@/lib/supabase/crud";


export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    console.log("GET request", request);
    const { tenantId } = await getTenantContextFromRequest(request);
    const reports = await fetchAdminSalesReports(tenantId);
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load sales reports", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as {
      date?: string;
      order_type?: string;
      invoice_no?: string;
    };
    const date = body.date || new Date().toISOString().split("T")[0];
    const order_type = body.order_type ?? "";
    const invoice_no = body.invoice_no?.trim() ?? "";

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const updated = await getOrderSalesReportByDate(
        tenantId,
        order_type,
        date,
        invoice_no
      );
      
      const formattedReport = updated.map((item) => ({
        ...item,
        created_at: item.created_at
          ? new Date(item.created_at).toISOString().split("T")[0]
          : null,
      }));
      
      return NextResponse.json({ report: formattedReport });
  } catch (error) {
    return NextResponse.json({ error: "Unable to get order sales report", detail: getErrorMessage(error) }, { status: 500 });
  }
}