"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
import { RefreshCw } from "lucide-react";
import type { CafeOrder, OrderResponse, OrdersResponse, OrderStatus, PaymentStatus } from "@/types/cafe";

const orderStatuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];
const paymentStatuses: PaymentStatus[] = ["Pending", "Paid"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = (await response.json()) as OrdersResponse;
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 6000);
    return () => clearInterval(interval);
  }, []);

  async function updateOrder(id: number, patch: Partial<Pick<CafeOrder, "status" | "payment_status">>): Promise<void> {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = (await response.json()) as OrderResponse;
    if (response.ok) {
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, ...data.order } : order))
      );
    }
  }

  return (
    <AdminGuard>
      <section className="space-y-5">
        <div className="glass-panel rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-saffron">Kitchen Counter</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Live Orders</h2>
            </div>
            <button
              onClick={loadOrders}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-3 font-semibold text-crema"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            No orders yet. Place a customer order from the menu page to see it here.
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-white/10 bg-white/8 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_180px_160px_130px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-crema">{order.order_id}</p>
                      <span className="rounded-lg bg-saffron/18 px-2 py-1 text-xs font-semibold text-saffron">
                        Table {order.table_id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-crema/62">
                      {order.customer_name} · {order.customer_mobile}
                    </p>
                    <p className="mt-1 text-xs text-crema/42">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <select
                    value={order.status}
                    onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })}
                    className="rounded-lg border border-white/10 bg-espresso px-3 py-3 text-crema outline-none focus:border-saffron"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={order.payment_status || "Pending"}
                    onChange={(event) => updateOrder(order.id, { payment_status: event.target.value as PaymentStatus })}
                    className="rounded-lg border border-white/10 bg-espresso px-3 py-3 text-crema outline-none focus:border-saffron"
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <p className="text-right text-lg font-semibold text-crema lg:text-left">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminGuard>
  );
}
