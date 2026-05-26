"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
import { RefreshCw, Receipt, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BillingMethod,
  CafeOrder,
  OrderResponse,
  OrdersResponse,
  OrderStatus,
  PaymentStatus,
} from "@/types/cafe";

const orderStatuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];
const paymentStatuses: PaymentStatus[] = ["Pending", "Paid"];
const billingMethods: BillingMethod[] = ["UPI", "Cash"];

interface ReceiptDialogProps {
  order: CafeOrder | null;
  loading: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSelectBillingMethod: (method: BillingMethod) => void;
}

function ReceiptDialog({
  order,
  loading,
  saving,
  error,
  onClose,
  onSelectBillingMethod,
}: ReceiptDialogProps) {
  if (!order && !loading) return null;

  const items = order?.items || [];
  const calculatedTotal = items.reduce(
    (sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0),
    0
  );
  const total = Number(order?.total_amount || calculatedTotal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#211713] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-saffron">Receipt</p>
            <h3 className="mt-1 text-xl font-semibold text-crema">
              {order?.order_id || "Loading order..."}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema/70 transition hover:text-crema disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close receipt"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/8 p-6 text-center text-crema/70">
            Loading receipt...
          </div>
        ) : order ? (
          <>
            <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-crema/70 sm:grid-cols-2">
              <p>
                <span className="text-crema/45">Customer:</span> {order.customer_name}
              </p>
              <p>
                <span className="text-crema/45">Mobile:</span> {order.customer_mobile}
              </p>
              <p>
                <span className="text-crema/45">Table:</span> {order.table_id}
              </p>
              <p>
                <span className="text-crema/45">Date:</span>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-white/10">
              <div className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-white/10 bg-white/8 px-4 py-3 text-xs font-semibold uppercase text-crema/50">
                <span>S.No</span>
                <span>Menu Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-crema/60">
                  No item details found for this order.
                </div>
              ) : (
                items.map((item) => {
                  const price = Number(item.price_at_time || 0);
                  const quantity = Number(item.quantity || 0);

                  return (
                    <div
                      key={`${item.menu_item_id}-${item.id || item.name}`}
                      className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-white/8 px-4 py-3 text-sm text-crema/75 last:border-b-0"
                    >
                      <span className="min-w-0 font-medium text-crema">{items.indexOf(item) + 1}</span>
                      <span className="min-w-0 font-medium text-crema">{item.name}</span>
                      <span className="text-right">{quantity}</span>
                      <span className="text-right">{formatCurrency(price)}</span>
                      <span className="text-right font-semibold text-crema">
                        {formatCurrency(price * quantity)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-white/8 p-4 text-lg font-semibold text-crema">
              <span>Total Price</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {billingMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => onSelectBillingMethod(method)}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso transition hover:bg-[#efb150] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : method}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<CafeOrder | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  console.log("AdminOrders rendered with orders:", orders); 

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

  async function updateOrder(
    id: number,
    patch: Partial<Pick<CafeOrder, "status" | "payment_status" | "billing_method">>
  ) {
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

  async function openReceipt(order: CafeOrder) {
    setReceiptOrder(order);
    setReceiptError("");
    setReceiptLoading(true);

    const response = await fetch(`/api/orders?id=${encodeURIComponent(String(order.id))}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as OrderResponse;

    if (response.ok && data.order) {
      setReceiptOrder(data.order);
    } else {
      setReceiptError(data.error || data.detail || "Unable to load receipt details.");
    }

    setReceiptLoading(false);
  }

  async function saveBillingMethod(method: BillingMethod) {
    if (!receiptOrder) return;

    setReceiptError("");
    setReceiptSaving(true);

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: receiptOrder.id,
        billing_method: method,
        payment_status: "Paid",
      }),
    });
    const data = (await response.json()) as OrderResponse;

    if (response.ok && data.order) {
      const updatedOrder = {
        ...receiptOrder,
        ...data.order,
        items: receiptOrder.items,
        billing_method: method,
        payment_status: "Paid" as PaymentStatus,
      };

      setReceiptOrder(updatedOrder);
      setOrders((current) =>
        current.map((order) => (order.id === receiptOrder.id ? { ...order, ...updatedOrder } : order))
      );
      setReceiptError("");
    } else {
      setReceiptError(data.error || data.detail || "Unable to save billing method.");
    }

    setReceiptSaving(false);
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-3 font-semibold text-crema transition hover:bg-white/12"
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
              <article key={order.id} className="flex gap-4 rounded-2xl border border-white/8 bg-espresso/60 p-4 sm:p-5">

                {/* LEFT — customer details + dropdowns */}
                <div className="flex flex-1 flex-col gap-3 min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-crema">{order.order_id}</span>
                      <span className="rounded-md border border-saffron/30 bg-saffron/12 px-2 py-0.5 text-[11px] font-semibold text-saffron">
                        Table {order.table_id}
                      </span>
                    </div>
                    <p className="text-[13px] text-crema/60">{order.customer_name} · {order.customer_mobile}</p>
                    <p className="mt-0.5 text-[11px] text-crema/30">{new Date(order.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 ">

                    {/* Order Status */}
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrder(order.id, { status: value as OrderStatus })}
                    >
                      <SelectTrigger className="flex-1 min-w-[130px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-crema focus:border-saffron focus:ring-0">
                        <SelectValue placeholder="Order Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-white/10 bg-[#1a1210] text-crema shadow-xl">
                        {orderStatuses.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-[13px] text-crema/80 focus:bg-white/8 focus:text-crema"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Payment Status */}
                    <Select
                      value={order.payment_status || "Pending"}
                      onValueChange={(value) => updateOrder(order.id, { payment_status: value as PaymentStatus })}
                    >
                      <SelectTrigger className="flex-1 min-w-[130px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-crema focus:border-saffron focus:ring-0">
                        <SelectValue placeholder="Payment" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-white/10 bg-[#1a1210] text-crema shadow-xl">
                        {paymentStatuses.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-[13px] text-crema/80 focus:bg-white/8 focus:text-crema"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                  </div>
                </div>

                {/* Vertical divider */}
                <div className="w-px self-stretch bg-white/7 shrink-0" />

                {/* RIGHT — amount, badges, receipt */}
                <div className="flex min-w-[155px] flex-col items-end justify-between gap-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-crema">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <div className="flex gap-1.5">
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        order.status === "Served"    ? "border-green-500/28 bg-green-500/10 text-green-400" :
                        order.status === "Preparing" ? "border-saffron/28  bg-saffron/10  text-saffron"     :
                        order.status === "Cancelled" ? "border-red-500/28  bg-red-500/10  text-red-400"     :
                                                       "border-white/12    bg-white/6     text-crema/50"
                      }`}>{order.status}</span>

                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        order.payment_status === "Paid" ? "border-green-500/28 bg-green-500/10 text-green-400" :
                                                          "border-saffron/28  bg-saffron/10  text-saffron"
                      }`}>{order.payment_status || "Pending"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openReceipt(order)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-saffron/28 bg-saffron/10 px-3 py-2 text-[13px] font-medium text-saffron transition hover:bg-saffron/18"
                  >
                    <Receipt size={14} aria-hidden="true" />
                    Generate Receipt
                  </button>
                </div>

              </article>
            ))}
          </div>
        )}

        <ReceiptDialog
          order={receiptOrder}
          loading={receiptLoading}
          saving={receiptSaving}
          error={receiptError}
          onClose={() => setReceiptOrder(null)}
          onSelectBillingMethod={saveBillingMethod}
        />
      </section>
    </AdminGuard>
  );
}
