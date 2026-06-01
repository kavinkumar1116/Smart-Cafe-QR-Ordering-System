import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { makeOrderCode } from "@/lib/format";
import { calcGrandTotal, calcTax } from "@/lib/order-math";
import {
  appendOrderItems,
  createOrder,
  fetchMenuItems,
  fetchOpenOrderByTableNumber,
  fetchOrderById,
  fetchTableById,
  fetchTableByNumber,
} from "@/lib/supabase/crud";
import type { OrderMode, PaymentStatus } from "@/types/cafe";

interface IncomingOrderItem {
  id?: number | string;
  menu_item_id?: number | string;
  quantity?: number | string;
}

interface CreateOrderRequest {
  table_id?: number | string;
  table_number?: number | string;
  customer_name?: string;
  customer_mobile?: string;
  payment_status?: PaymentStatus;
  order_type?: OrderMode;
  items?: IncomingOrderItem[];
}

function normalizeItems(items: unknown): { menu_item_id: number; quantity: number }[] {
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
  const { tenantId } = await getTenantContextFromRequest(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  try {
    const order = await fetchOrderById(id, tenantId);

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
    const { tenantId } = await getTenantContextFromRequest(request);
    const body = (await request.json()) as CreateOrderRequest;
    const requestedTableNumber = Number(body.table_number);
    const requestedTableId = Number(body.table_id);
    const customerName = String(body.customer_name || "").trim();
    const customerMobile = String(body.customer_mobile || "").trim();
    const paymentStatus: PaymentStatus = body.payment_status === "Paid" ? "Paid" : "Pending";
    const orderType: OrderMode = body.order_type === "Takeaway" ? "Takeaway" : "Dine-In";
    const items = normalizeItems(body.items);

    if ((!requestedTableNumber && !requestedTableId) || !customerName || !customerMobile || items.length === 0) {
      return NextResponse.json(
        { error: "Table, customer details, and order items are required" },
        { status: 400 }
      );
    }

    const table = requestedTableNumber
      ? await fetchTableByNumber(requestedTableNumber, tenantId)
      : await fetchTableById(requestedTableId, tenantId);

    if (!table) {
      return NextResponse.json({ error: "Selected table is not available" }, { status: 400 });
    }

    const menuItems = await fetchMenuItems(tenantId);
    const priceMap = new Map(
      menuItems.filter((menuItem) => menuItem.is_available).map((menuItem) => [menuItem.id, Number(menuItem.price)])
    );

    const openOrder = await fetchOpenOrderByTableNumber(table.table_number, tenantId);
    const orderItems = items.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_time: priceMap.get(item.menu_item_id) || 0,
    }));

    if (openOrder) {
      const order = await appendOrderItems(openOrder.id, orderItems, {
        customer_name: customerName || openOrder.customer_name,
        customer_mobile: customerMobile || openOrder.customer_mobile,
        order_type: orderType,
        table_id: table.id,
        table_number: table.table_number,
        session_status: "OPEN",
        payment_status: "Pending",
        total_amount: Number(openOrder.total_amount || 0) +
          orderItems.reduce((sum, item) => sum + item.price_at_time * item.quantity, 0),
      },
      tenantId);

      return NextResponse.json({ order }, { status: 200 });
    }

    const order = await createOrder(
      {
        order_id: makeOrderCode(),
        table_id: table.id,
        table_number: table.table_number,
        customer_name: customerName,
        customer_mobile: customerMobile,
        status: "Pending",
        session_status: "OPEN",
        payment_status: paymentStatus,
        order_type: orderType,
        total_amount: orderItems.reduce((sum, item) => sum + item.price_at_time * item.quantity, 0),
      },
      orderItems,
      tenantId
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
