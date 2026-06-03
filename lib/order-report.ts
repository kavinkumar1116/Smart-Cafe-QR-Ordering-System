import { calcGrandTotal, calcSubtotal, calcTax } from "@/lib/order-math";
import type { CafeOrder, OrderItem, OrderStatus } from "@/types/cafe";

export type OrderReportFilters = {
  date_from?: string;
  date_to?: string;
  status?: string;
  table_number?: string;
  payment_method?: string;
  customer_name?: string;
  order_type?: string;
};

export type OrderReportRow = {
  id: number;
  order_id: string;
  created_at: string;
  table_number: number | string | null;
  customer_name: string;
  order_type: string;
  total_items: number;
  order_amount: number;
  discount: number;
  gst: number;
  net_amount: number;
  payment_method: string;
  order_status: OrderStatus | string;
};

export type OrderReportSummary = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
};

const PENDING_STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready"];

export function isCompletedStatus(status: string): boolean {
  return status === "Served";
}

export function isPendingStatus(status: string): boolean {
  return PENDING_STATUSES.includes(status as OrderStatus);
}

export function isCancelledStatus(status: string): boolean {
  return status === "Cancelled";
}

export function enrichOrderForReport(
  order: CafeOrder & { items?: OrderItem[] }
): OrderReportRow {
  const items = order.items || [];
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const orderAmount =
    items.length > 0
      ? calcSubtotal(
          items.map((item) => ({
            price: item.price_at_time,
            quantity: item.quantity,
          }))
        )
      : Number(order.total_amount || 0);
  const discount = 0;
  const taxableAmount = Math.max(0, orderAmount - discount);
  const gst = calcTax(taxableAmount);
  const netAmount = calcGrandTotal(taxableAmount, gst);

  const paymentMethod = order.billing_method
    ? order.billing_method
    : order.payment_status === "Paid"
      ? "Paid"
      : "Pending";

  return {
    id: order.id,
    order_id: order.order_id,
    created_at: order.created_at,
    table_number: order.table_number ?? order.table_id,
    customer_name: order.customer_name,
    order_type: order.order_type || "Dine-In",
    total_items: totalItems,
    order_amount: orderAmount,
    discount,
    gst,
    net_amount: netAmount,
    payment_method: paymentMethod,
    order_status: order.status,
  };
}

export function computeOrderReportSummary(
  rows: OrderReportRow[]
): OrderReportSummary {
  const completed = rows.filter((row) => isCompletedStatus(row.order_status));
  const pending = rows.filter((row) => isPendingStatus(row.order_status));
  const cancelled = rows.filter((row) => isCancelledStatus(row.order_status));
  const totalRevenue = completed.reduce((sum, row) => sum + row.net_amount, 0);

  return {
    totalOrders: rows.length,
    completedOrders: completed.length,
    pendingOrders: pending.length,
    cancelledOrders: cancelled.length,
    totalRevenue,
    averageOrderValue:
      completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
  };
}

export function formatOrderDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
