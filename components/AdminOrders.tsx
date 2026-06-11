"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { formatCurrency } from "@/lib/format";
import { useRealtimeTable } from "@/lib/supabase/realtime";
import { RefreshCw, Receipt, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  SessionStatus,
} from "@/types/cafe";
import jsPDF from "jspdf";

const orderStatuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Served","Paid", "Cancelled"];
const paymentStatuses: PaymentStatus[] = ["Pending", "Paid", "Cancelled"];
const billingMethods: BillingMethod[] = ["UPI", "Cash"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ── Badge helpers ────────────────────────────────────────────────
function orderStatusClass(status: string) {
  switch (status) {
    case "Served": return "border-green-500/30 bg-green-500/10 text-green-400";
    case "Preparing": return "border-saffron/30  bg-saffron/10  text-saffron";
    case "Ready": return "border-blue-400/30  bg-blue-400/10  text-blue-400";
    case "Cancelled": return "border-red-500/30  bg-red-500/10  text-red-400";
    default: return "border-white/12    bg-white/6     text-crema/50";
  }
}

function paymentStatusClass(status: string) {
  return status === "Paid"
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : status === "Cancelled"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-saffron/30  bg-saffron/10  text-saffron";
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

// ── Receipt Dialog (unchanged logic) ────────────────────────────
interface ReceiptDialogProps {
  order: CafeOrder | null;
  loading: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSelectBillingMethod: (method: BillingMethod) => void;
  onCancelOrder: (orderId: number) => void;
}

function ReceiptDialog({ order, loading, saving, error, onClose, onSelectBillingMethod, onCancelOrder }: ReceiptDialogProps) {
  if (!order && !loading) return null;

  const items = order?.items || [];
  const calculatedTotal = items.reduce((sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-600">Receipt</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{order?.order_id || "Loading order..."}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            aria-label="Close receipt"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
            Loading receipt...
          </div>
        ) : order ? (
          <>
            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Customer</p>
                <p className="mt-1 font-medium text-slate-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Mobile</p>
                <p className="mt-1 font-medium text-slate-900">{order.customer_mobile}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Table</p>
                <p className="mt-1 font-medium text-slate-900">{order.table_number || order.table_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Date</p>
                <p className="mt-1 font-medium text-slate-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              <div className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-600 sticky top-0">
                <span>S.No</span><span>Menu Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-600">No item details found.</div>
              ) : (
                items.map((item) => {
                  const price = Number(item.price_at_time || 0);
                  const quantity = Number(item.quantity || 0);
                  return (
                    <div
                      key={`${item.menu_item_id}-${item.id || item.name}`}
                      className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-b-0"
                    >
                      <span className="font-medium text-slate-900">{items.indexOf(item) + 1}</span>
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="text-right">{quantity}</span>
                      <span className="text-right">{formatCurrency(price)}</span>
                      <span className="text-right font-semibold text-slate-900">{formatCurrency(price * quantity)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-100 p-4 text-lg font-semibold text-slate-900">
              <span>Total Price</span>
              <span>{formatCurrency(calculatedTotal)}</span>
            </div>

            {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 border border-rose-200">{error}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {order?.status !== "Cancelled" ? (
                <>
                  {billingMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => onSelectBillingMethod(method)}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : method}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => order && onCancelOrder(order.id)}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg"
                  >
                    Cancel Order
                  </button>
                </>
              ) : (
                <div className="col-span-3 rounded-lg bg-red-50 border border-red-200 p-3 text-center text-red-700 font-medium">
                  This order is already cancelled.
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const downloadReceipt = async (
  order: CafeOrder,
  billingMethod: string
) => {
  const items = order.items ?? [];

  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price_at_time || 0) *
      Number(item.quantity || 0),
    0
  );

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // Thermal receipt size
  });

  let y = 10;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("SMART CAFE", 40, y, { align: "center" });

  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Chennai", 40, y, { align: "center" });

  y += 8;

  pdf.line(5, y, 75, y);

  y += 6;

  // Order Details
  pdf.text(`Order ID: ${order.order_id}`, 5, y);
  y += 6;

  pdf.text(
    `Date: ${new Date(order.created_at).toLocaleString()}`,
    5,
    y
  );
  y += 6;

  pdf.text(`Customer: ${order.customer_name}`, 5, y);
  y += 6;

  pdf.text(
    `Mobile: ${order.customer_mobile || "-"}`,
    5,
    y
  );
  y += 6;

  pdf.text(
    `Table: ${order.table_number || order.table_id}`,
    5,
    y
  );

  y += 6;

  pdf.line(5, y, 75, y);

  y += 6;

  // Table Header
  pdf.setFont("helvetica", "bold");

  pdf.text("Item", 5, y);
  pdf.text("Qty", 45, y);
  pdf.text("Amount", 75, y, {
    align: "right",
  });

  y += 5;

  pdf.line(5, y, 75, y);

  y += 5;

  pdf.setFont("helvetica", "normal");

  // Items
  items.forEach((item) => {
    const qty = Number(item.quantity || 0);

    const amount =
      Number(item.price_at_time || 0) * qty;

    pdf.text(item.name, 5, y);

    pdf.text(String(qty), 45, y);

    pdf.text(`${amount.toFixed(2)}`, 70, y, {
      align: "right",
    });

    y += 6;
  });

  y += 2;

  pdf.line(5, y, 75, y);

  y += 8;

  // Total
  pdf.setFont("helvetica", "bold");

  pdf.text(
    `Total : ${total.toFixed(2)}`,
    5,
    y
  );

  y += 8;

  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Billing Method : ${billingMethod}`,
    5,
    y
  );

  y += 12;

  pdf.setFont("helvetica", "bold");

  pdf.text(
    "THANK YOU!",
    40,
    y,
    {
      align: "center",
    }
  );

  pdf.save(`${order.order_id}.pdf`);
};

// ── Main Page ────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState<CafeOrder | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const loadOrders = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/orders", { cache: "no-store" });
    const data = (await response.json()) as OrdersResponse;
    setOrders(data.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useRealtimeTable({ table: "orders", onChange: loadOrders });
  useRealtimeTable({ table: "order_items", onChange: loadOrders });


  async function updateOrder(id: number, patch: Partial<Pick<CafeOrder, "status" | "payment_status" | "billing_method" | "session_status">>) {
    const response = await tenantApiFetch("/api/admin/orders", {
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
    const response = await tenantApiFetch(`/api/orders?id=${encodeURIComponent(String(order.id))}`, { cache: "no-store" });
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
    const response = await tenantApiFetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: receiptOrder.id, billing_method: method, payment_status: "Paid", status: "Paid" }),
    });
    const data = (await response.json()) as OrderResponse;
    if (response.ok && data.order) {
      const updatedOrder = { ...receiptOrder, ...data.order, items: receiptOrder.items, billing_method: method, payment_status: "Paid" as PaymentStatus, status: "Paid" as OrderStatus, session_status: "CLOSED" as SessionStatus };
      console.log("Updated Order:", updatedOrder);
      setReceiptOrder(updatedOrder);
      await downloadReceipt(updatedOrder, method);
      setOrders((current) =>
        current.map((order) => (order.id === receiptOrder.id ? { ...order, ...updatedOrder } : order))
      );
      setReceiptError("");
      setReceiptOrder(null);
    } else {
      setReceiptError(data.error || data.detail || "Unable to save billing method.");
    }
    setReceiptSaving(false);
  }


  async function onCancelOrder(orderId: number) {
    await updateOrder(orderId, {
      status: "Cancelled",
      payment_status: "Cancelled",
      session_status: "CLOSED",
    });

    if (receiptOrder && receiptOrder.id === orderId) {
      setReceiptOrder(null);
    }
  }
  // ── Filtered + paginated data ──────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_mobile?.toLowerCase().includes(q) ||
        String(o.table_number || o.table_id).includes(q)
    );
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // reset to page 1 when search or pageSize changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const cols = [
    { label: "SI.No", width: "w-14", align: "text-center" },
    { label: "Order ID", width: "w-32", align: "text-left" },
    { label: "Customer", width: "w-36", align: "text-left" },
    { label: "Contact", width: "w-36", align: "text-left" },
    { label: "Table", width: "w-16", align: "text-center" },
    { label: "Date", width: "w-40", align: "text-left" },
    { label: "Order Status", width: "w-24", align: "text-center" },
    { label: "Payment", width: "w-36", align: "text-left" },
    { label: "Method", width: "w-24", align: "text-center" },
    { label: "Action", width: "w-36", align: "text-center" },
  ];

  return (
    <AdminGuard>
      <section className="space-y-5">

        {/* Header panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Kitchen Counter</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-900">Live Orders</h2>
            </div>
            <button
              onClick={loadOrders}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {/* Table panel */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 bg-slate-50">
            <p className="text-sm font-medium text-slate-600">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">

              {/* Sticky head */}
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr>
                  {cols.map((col) => (
                    <th
                      key={col.label}
                      className={`${col.width} ${col.align} px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                      Loading orders...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                      {search ? "No orders match your search." : "No orders yet."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((order, idx) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                    >
                      {/* SI.No */}
                      <td className="px-6 py-3 text-center text-sm text-slate-500">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Order ID */}
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {order.order_id}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {order.customer_name}
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {order.customer_mobile}
                      </td>

                      {/* Table */}
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {order.table_number || order.table_id}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short",
                          year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
                        }).replace(",", "")}
                      </td>

                      {/* Order Status */}
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${(order.status || "Pending") === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${(order.payment_status || "Pending") === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {order.payment_status || "Pending"}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-3 text-center">
                        {order.billing_method ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {order.billing_method}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openReceipt(order)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${order.status === "Cancelled"
                              ? "bg-rose-600 text-white hover:bg-rose-700"
                              : order.billing_method
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                          <Receipt size={13} aria-hidden="true" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">

            {/* Page size */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Page info + controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {filtered.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`} of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page number pills */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${safePage === p
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Receipt modal — unchanged */}
        <ReceiptDialog
          order={receiptOrder}
          loading={receiptLoading}
          saving={receiptSaving}
          error={receiptError}
          onClose={() => setReceiptOrder(null)}
          onSelectBillingMethod={saveBillingMethod}
          onCancelOrder={onCancelOrder}
        />
      </section>
    </AdminGuard>
  );
}
