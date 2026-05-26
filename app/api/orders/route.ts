import { NextResponse } from "next/server";
import { demoMenuItems, demoOrders, makePublicOrder } from "@/lib/demo-store";
import { getErrorMessage } from "@/lib/api";
import { makeOrderCode } from "@/lib/format";
import { calcGrandTotal, calcTax } from "@/lib/order-math";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createOrder, fetchMenuItems, fetchOrderById } from "@/lib/supabase/crud";
import type { CafeOrder, OrderItem, OrderMode, PaymentStatus } from "@/types/cafe";

interface IncomingOrderItem {
  id?: number | string;
  menu_item_id?: number | string;
  quantity?: number | string;
}

interface CreateOrderRequest {
  table_id?: number | string;
  customer_name?: string;
  customer_mobile?: string;
  payment_status?: PaymentStatus;
  order_type?: OrderMode;
  items?: IncomingOrderItem[];
}

interface NormalizedOrderItem {
  menu_item_id: number;
  quantity: number;
}

function normalizeItems(items: unknown): NormalizedOrderItem[] {
  return Array.isArray(items)
    ? items
        .map((item: IncomingOrderItem) => ({
          menu_item_id: Number(item.menu_item_id || item.id),
          quantity: Math.max(1, Number(item.quantity || 1)),
        }))
        .filter((item) => Number.isFinite(item.menu_item_id))
    : [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  try {
    if (!isSupabaseConfigured()) {
      const order = demoOrders.find((entry) => String(entry.id) === String(id) || entry.order_id === id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order: makePublicOrder(order) });
    }

    const order = await fetchOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderRequest;
    const tableId = Number(body.table_id);
    const customerName = String(body.customer_name || "").trim();
    const customerMobile = String(body.customer_mobile || "").trim();
    const paymentStatus: PaymentStatus = body.payment_status === "Paid" ? "Paid" : "Pending";
    const orderType: OrderMode = body.order_type === "Takeaway" ? "Takeaway" : "Dine-In";
    const items = normalizeItems(body.items);

    if (!tableId || !customerName || !customerMobile || items.length === 0) {
      return NextResponse.json(
        { error: "Table, customer details, and order items are required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      const enrichedItems: OrderItem[] = items.map((item) => {
        const menuItem = demoMenuItems.find((entry) => entry.id === item.menu_item_id);
        return {
          id: item.menu_item_id,
          menu_item_id: item.menu_item_id,
          name: menuItem?.name || "Menu item",
          category: menuItem?.category || "Cafe",
          quantity: item.quantity,
          price_at_time: Number(menuItem?.price || 0),
        };
      });
      const total = enrichedItems.reduce(
        (sum, item) => sum + Number(item.price_at_time) * item.quantity,
        0
      );
      const tax = calcTax(total);
      const grandTotal = calcGrandTotal(total, tax);
      const order: CafeOrder = {
        id: demoOrders.length + 1,
        order_id: makeOrderCode(),
        table_id: tableId,
        customer_name: customerName,
        customer_mobile: customerMobile,
        status: "Pending",
        payment_status: paymentStatus,
        order_type: orderType,
        total_amount: grandTotal,
        created_at: new Date().toISOString(),
        items: enrichedItems,
      };
      demoOrders.unshift(order);
      return NextResponse.json({ order: makePublicOrder(order) }, { status: 201 });
    }

    const menuItems = await fetchMenuItems();
    const priceMap = new Map(
      menuItems
        .filter((menuItem) => menuItem.is_available)
        .map((menuItem) => [menuItem.id, Number(menuItem.price)])
    );
    const ids = items.map((item) => item.menu_item_id);

    if (ids.some((id) => !priceMap.has(id))) {
      throw new Error("Some selected items are no longer available");
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (priceMap.get(item.menu_item_id) || 0) * item.quantity,
      0
    );
    const tax = calcTax(subtotal);
    const total = calcGrandTotal(subtotal, tax);

    const order = await createOrder(
      {
        order_id: makeOrderCode(),
        table_id: tableId,
        customer_name: customerName,
        customer_mobile: customerMobile,
        status: "Pending",
        payment_status: paymentStatus,
        order_type: orderType,
        total_amount: total,
      },
      items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_time: priceMap.get(item.menu_item_id) || 0,
      }))
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
