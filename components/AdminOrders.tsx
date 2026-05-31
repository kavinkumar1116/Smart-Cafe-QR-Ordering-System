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
} from "@/types/cafe";

const orderStatuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];
const paymentStatuses: PaymentStatus[] = ["Pending", "Paid"];
const billingMethods: BillingMethod[] = ["UPI", "Cash"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ── Badge helpers ────────────────────────────────────────────────
function orderStatusClass(status: string) {
  switch (status) {
    case "Served":    return "border-green-500/30 bg-green-500/10 text-green-400";
    case "Preparing": return "border-saffron/30  bg-saffron/10  text-saffron";
    case "Ready":     return "border-blue-400/30  bg-blue-400/10  text-blue-400";
    case "Cancelled": return "border-red-500/30  bg-red-500/10  text-red-400";
    default:          return "border-white/12    bg-white/6     text-crema/50";
  }
}

function paymentStatusClass(status: string) {
  return status === "Paid"
    ? "border-green-500/30 bg-green-500/10 text-green-400"
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
}

function ReceiptDialog({ order, loading, saving, error, onClose, onSelectBillingMethod }: ReceiptDialogProps) {
  if (!order && !loading) return null;

  const items = order?.items || [];
  const calculatedTotal = items.reduce((sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0), 0);
 
  // const total = Number(order?.total_amount || calculatedTotal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#211713] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-saffron">Receipt</p>
            <h3 className="mt-1 text-xl font-semibold text-crema">{order?.order_id || "Loading order..."}</h3>
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
              <p><span className="text-crema/45">Customer:</span> {order.customer_name}</p>
              <p><span className="text-crema/45">Mobile:</span> {order.customer_mobile}</p>
              <p><span className="text-crema/45">Table:</span> {order.table_number || order.table_id}</p>
              <p><span className="text-crema/45">Date:</span> {new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-white/10">
              <div className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-white/10 bg-white/8 px-4 py-3 text-xs font-semibold uppercase text-crema/50">
                <span>S.No</span><span>Menu Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-crema/60">No item details found.</div>
              ) : (
                items.map((item) => {
                  const price    = Number(item.price_at_time || 0);
                  const quantity = Number(item.quantity || 0);
                  return (
                    <div
                      key={`${item.menu_item_id}-${item.id || item.name}`}
                      className="grid grid-cols-[50px_1fr_70px_100px_110px] gap-3 border-b border-white/8 px-4 py-3 text-sm text-crema/75 last:border-b-0"
                    >
                      <span className="font-medium text-crema">{items.indexOf(item) + 1}</span>
                      <span className="font-medium text-crema">{item.name}</span>
                      <span className="text-right">{quantity}</span>
                      <span className="text-right">{formatCurrency(price)}</span>
                      <span className="text-right font-semibold text-crema">{formatCurrency(price * quantity)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-white/8 p-4 text-lg font-semibold text-crema">
              <span>Total Price</span>
              <span>{formatCurrency(calculatedTotal)}</span>
            </div>

            {error && <p className="mt-4 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p>}

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

// ── Main Page ────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders]               = useState<CafeOrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [pageSize, setPageSize]           = useState(10);
  const [page, setPage]                   = useState(1);
  const [receiptOrder, setReceiptOrder]   = useState<CafeOrder | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptSaving, setReceiptSaving]   = useState(false);
  const [receiptError, setReceiptError]     = useState("");

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

  async function updateOrder(id: number, patch: Partial<Pick<CafeOrder, "status" | "payment_status" | "billing_method">>) {
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
      body: JSON.stringify({ id: receiptOrder.id, billing_method: method, payment_status: "Paid" }),
    });
    const data = (await response.json()) as OrderResponse;
    if (response.ok && data.order) {
      const updatedOrder = { ...receiptOrder, ...data.order, items: receiptOrder.items, billing_method: method, payment_status: "Paid" as PaymentStatus };
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
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // reset to page 1 when search or pageSize changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const cols = [
    { label: "SI.No",      width: "w-14",   align: "text-center" },
    { label: "Order ID",   width: "w-32",   align: "text-left"   },
    { label: "Customer",   width: "w-36",   align: "text-left"   },
    { label: "Contact",    width: "w-36",   align: "text-left"   },
    { label: "Table",      width: "w-16",   align: "text-center" },
    { label: "Date",       width: "w-40",   align: "text-left"   },
    { label: "Payment",    width: "w-36",   align: "text-left"   },
    { label: "Method",     width: "w-24",   align: "text-center" },
    { label: "Receipt",    width: "w-36",   align: "text-center" },
  ];

  return (
    <AdminGuard>
      <section className="space-y-5">

        {/* Header panel */}
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

        {/* Table panel */}
        <div className="rounded-2xl border border-white/8 bg-espresso/60">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <p className="text-sm text-crema/50">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/35" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-[13px] text-crema placeholder:text-crema/30 outline-none focus:border-saffron"
              />
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">

              {/* Sticky head */}
              <thead className="sticky top-0 z-10 bg-[#1a1210]">
                <tr>
                  {cols.map((col) => (
                    <th
                      key={col.label}
                      className={`${col.width} ${col.align} border-b border-white/8 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-crema/40 whitespace-nowrap`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-crema/50">
                      Loading orders...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-crema/50">
                      {search ? "No orders match your search." : "No orders yet."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((order, idx) => (
                    <tr
                      key={order.id}
                      className="border-b border-white/5 transition hover:bg-white/4 last:border-b-0"
                    >
                      {/* SI.No */}
                      <td className="px-4 py-3 text-center text-[13px] text-crema/40">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Order ID */}
                      <td className="px-4 py-3 text-[13px] font-semibold text-crema whitespace-nowrap">
                        {order.order_id}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 text-[13px] text-crema/75 whitespace-nowrap">
                        {order.customer_name}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3 text-[13px] text-crema/60 whitespace-nowrap">
                        {order.customer_mobile}
                      </td>

                      {/* Table */}
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-md border border-saffron/30 bg-saffron/12 px-2 py-0.5 text-[11px] font-semibold text-saffron">
                          {order.table_number || order.table_id}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[12px] text-crema/45 whitespace-nowrap">
                       {new Date(order.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short",
    year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",  hour12: true, }).replace(",", "")}
                      </td>

                      {/* Payment Status */}
                     <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-8 min-w-[100px] items-center justify-center rounded-full px-3 text-[12px] font-semibold text-white ${
                            (order.payment_status || "Pending") === "Paid"
                              ? "bg-green-600"
                              : "bg-red-600"
                          }`}
                        >
                          {order.payment_status || "Pending"}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3 text-center">
                        {order.billing_method ? (
                          <Badge
                            label={order.billing_method}
                            className="border-white/12 bg-white/6 text-crema/60"
                          />
                        ) : (
                          <span className="text-[12px] text-crema/25">—</span>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openReceipt(order)}
                         className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition whitespace-nowrap${order.billing_method ? "border border-green-500/30 bg-green-600 text-white hover:bg-green-700" : "border border-saffron/28 bg-saffron/10 text-saffron hover:bg-saffron/18"}`}
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-4">

            {/* Page size */}
            <div className="flex items-center gap-2 text-[13px] text-crema/50">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[13px] text-crema outline-none focus:border-saffron"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Page info + controls */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-crema/40">
                {filtered.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`} of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
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
                      <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-[13px] text-crema/30">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition ${
                          safePage === p
                            ? "bg-saffron text-espresso"
                            : "border border-white/10 bg-white/5 text-crema/60 hover:bg-white/10"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
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
        />
      </section>
    </AdminGuard>
  );
}
