import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { demoMenuItems, demoOrders, makePublicOrder } from "@/lib/demo-store";
import { getErrorMessage } from "@/lib/api";
import { makeOrderCode } from "@/lib/format";
import { calcGrandTotal, calcTax } from "@/lib/order-math";
import type { CafeOrder, OrderItem } from "@/types/cafe";

interface IncomingOrderItem {
  id?: number | string;
  menu_item_id?: number | string;
  quantity?: number | string;
}

interface CreateOrderRequest {
  table_id?: number | string;
  customer_name?: string;
  customer_mobile?: string;
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
    if (!pool) {
      const order = demoOrders.find((entry) => String(entry.id) === String(id) || entry.order_id === id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order: makePublicOrder(order) });
    }

    const orderResult = await pool.query(
      `SELECT id, order_id, table_id, customer_name, customer_mobile, status, payment_status, total_amount, created_at
       FROM orders
       WHERE id = $1 OR order_id = $2
       LIMIT 1`,
      [Number(id) || 0, id]
    );

    if (orderResult.rowCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price_at_time, mi.name, mi.category
       FROM order_items oi
       JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return NextResponse.json({ order: { ...order, items: itemsResult.rows } });
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
    const items = normalizeItems(body.items);

    if (!tableId || !customerName || !customerMobile || items.length === 0) {
      return NextResponse.json(
        { error: "Table, customer details, and order items are required" },
        { status: 400 }
      );
    }

    if (!pool) {
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
        payment_status: "Pending",
        total_amount: grandTotal,
        created_at: new Date().toISOString(),
        items: enrichedItems,
      };
      demoOrders.unshift(order);
      return NextResponse.json({ order: makePublicOrder(order) }, { status: 201 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const ids = items.map((item) => item.menu_item_id);
      const menuResult = await client.query(
        "SELECT id, price FROM menu_items WHERE id = ANY($1::int[]) AND is_available = true",
        [ids]
      );
      const priceMap = new Map<number, number>(menuResult.rows.map((row) => [Number(row.id), Number(row.price)]));

      if (priceMap.size !== ids.length) {
        throw new Error("Some selected items are no longer available");
      }

      const subtotal = items.reduce(
        (sum, item) => sum + (priceMap.get(item.menu_item_id) || 0) * item.quantity,
        0
      );
      const tax = calcTax(subtotal);
      const total = calcGrandTotal(subtotal, tax);

      const orderResult = await client.query(
        `INSERT INTO orders (order_id, table_id, customer_name, customer_mobile, status, payment_status, total_amount)
         VALUES ($1, $2, $3, $4, 'Pending', 'Pending', $5)
         RETURNING id, order_id, table_id, customer_name, customer_mobile, status, payment_status, total_amount, created_at`,
        [makeOrderCode(), tableId, customerName, customerMobile, total]
      );

      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.menu_item_id, item.quantity, priceMap.get(item.menu_item_id)]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ order }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
