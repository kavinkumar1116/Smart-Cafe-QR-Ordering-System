import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchOrders, updateOrderStatus } from "@/lib/supabase/crud";
import type { BillingMethod, OrderStatus, PaymentStatus } from "@/types/cafe";

interface UpdateOrderRequest {
  id?: number | string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  billing_method?: BillingMethod;
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const orders = await fetchOrders(tenantId);
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load admin orders", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateOrderRequest;
    const id = Number(body.id);
    const status = body.status;
    const paymentStatus = body.payment_status;
    const billingMethod = body.billing_method;

    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const order = await updateOrderStatus(id, status, paymentStatus, billingMethod, tenantId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
