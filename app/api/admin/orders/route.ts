import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { demoOrders, makePublicOrder } from "@/lib/demo-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchOrders, updateOrderStatus } from "@/lib/supabase/crud";
import type { BillingMethod, OrderStatus, PaymentStatus } from "@/types/cafe";

interface UpdateOrderRequest {
  id?: number | string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  billing_method?: BillingMethod;
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ orders: demoOrders.map(makePublicOrder) });
    }

    const orders = await fetchOrders();
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
      const order = demoOrders.find((entry) => entry.id === id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (status) order.status = status;
      if (paymentStatus) order.payment_status = paymentStatus;
      if (billingMethod) order.billing_method = billingMethod;
      return NextResponse.json({ order: makePublicOrder(order) });
    }

    const order = await updateOrderStatus(id, status, paymentStatus, billingMethod);

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
