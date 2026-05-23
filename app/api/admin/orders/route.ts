import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getErrorMessage } from "@/lib/api";
import { demoOrders, makePublicOrder } from "@/lib/demo-store";
import type { OrderStatus, PaymentStatus } from "@/types/cafe";

interface UpdateOrderRequest {
  id?: number | string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
}

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ orders: demoOrders.map(makePublicOrder) });
    }

    const { rows } = await pool.query(
      `SELECT id, order_id, table_id, customer_name, customer_mobile, status, payment_status, total_amount, created_at
       FROM orders
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ orders: rows });
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

    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    if (!pool) {
      const order = demoOrders.find((entry) => entry.id === id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (status) order.status = status;
      if (paymentStatus) order.payment_status = paymentStatus;
      return NextResponse.json({ order: makePublicOrder(order) });
    }

    const { rows } = await pool.query(
      `UPDATE orders
       SET status = COALESCE($2, status),
           payment_status = COALESCE($3, payment_status)
       WHERE id = $1
       RETURNING id, order_id, table_id, customer_name, customer_mobile, status, payment_status, total_amount, created_at`,
      [id, status || null, paymentStatus || null]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update order", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
