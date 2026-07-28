"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import AdminGuard from "@/components/AdminGuard";
import ExportDropdown, {
  type ExportColumn,
} from "@/components/common/ExportDropdown";
import { formatCurrency } from "@/lib/format";
import { calcGrandTotal, calcSubtotal, calcTax } from "@/lib/order-math";
import {
  computeOrderReportSummary,
  formatOrderDateTime,
  type OrderReportRow,
  type OrderReportSummary,
} from "@/lib/order-report";
import {
  buildPrintableTableHtml,
  printHtmlReport,
} from "@/lib/print-report";
import { tenantApiFetch } from "@/lib/tenant";
import type { CafeOrder, OrderResponse } from "@/types/cafe";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  IndianRupee,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const DEFAULT_SUMMARY: OrderReportSummary = {
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
};

type SortKey = keyof Pick<
  OrderReportRow,
  | "order_id"
  | "created_at"
  | "table_number"
  | "customer_name"
  | "order_type"
  | "total_items"
  | "order_amount"
  | "discount"
  | "gst"
  | "net_amount"
  | "payment_method"
  | "order_status"
>;

type SortDirection = "asc" | "desc";

const SORTABLE_COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "order_id", label: "Order No" },
  { key: "created_at", label: "Date & Time" },
  { key: "table_number", label: "Table No" },
  { key: "customer_name", label: "Customer Name" },
  { key: "order_type", label: "Order Type" },
  { key: "total_items", label: "Total Items", align: "text-center" },
  { key: "order_amount", label: "Order Amount", align: "text-right" },
  { key: "discount", label: "Discount", align: "text-right" },
  { key: "gst", label: "GST", align: "text-right" },
  { key: "net_amount", label: "Net Amount", align: "text-right" },
  { key: "payment_method", label: "Payment Method" },
  { key: "order_status", label: "Order Status" },
];

const ORDER_REPORT_EXPORT_COLUMNS: ExportColumn<OrderReportRow>[] = [
  { header: "Order No", accessor: (row) => row.order_id },
  {
    header: "Date & Time",
    accessor: (row) => formatOrderDateTime(row.created_at),
  },
  { header: "Table No", accessor: (row) => row.table_number ?? "" },
  { header: "Customer Name", accessor: (row) => row.customer_name },
  { header: "Order Type", accessor: (row) => row.order_type },
  { header: "Total Items", accessor: (row) => row.total_items },
  {
    header: "Order Amount",
    accessor: (row) => row.order_amount,
  },
  { header: "Discount", accessor: (row) => row.discount },
  { header: "GST", accessor: (row) => row.gst },
  { header: "Net Amount", accessor: (row) => row.net_amount },
  { header: "Payment Method", accessor: (row) => row.payment_method },
  { header: "Order Status", accessor: (row) => row.order_status },
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Served":
      return "bg-emerald-100 text-emerald-700";
    case "Preparing":
      return "bg-amber-100 text-amber-700";
    case "Ready":
      return "bg-blue-100 text-blue-700";
    case "Cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "emerald" | "blue" | "amber" | "rose" | "slate";
}

function SummaryCard({ label, value, icon, tone }: SummaryCardProps) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-lg bg-white/70 p-2">{icon}</div>
      </div>
    </div>
  );
}

interface OrderDetailsDialogProps {
  order: CafeOrder | null;
  loading: boolean;
  onClose: () => void;
}

function OrderDetailsDialog({ order, loading, onClose }: OrderDetailsDialogProps) {
  if (!order && !loading) return null;

  const items = order?.items || [];
  const subtotal = calcSubtotal(
    items.map((item) => ({
      price: item.price_at_time,
      quantity: item.quantity,
    }))
  );
  const discount = 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = calcTax(taxableAmount);
  const finalAmount = calcGrandTotal(taxableAmount, gst);

  const timeline = [
    {
      title: "Order Placed",
      detail: order ? formatOrderDateTime(order.created_at) : "",
      active: true,
    },
    {
      title: `Status: ${order?.status || "Pending"}`,
      detail: order?.status === "Served" ? "Order completed" : "In progress",
      active: Boolean(order),
    },
    {
      title: "Payment",
      detail: order?.billing_method
        ? `${order.billing_method} (${order.payment_status})`
        : order?.payment_status || "Pending",
      active: order?.payment_status === "Paid",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-600">Order Details</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              {order?.order_id || "Loading..."}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Close order details"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Loading order details...
          </div>
        ) : order ? (
          <>
            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Customer</p>
                <p className="mt-1 font-medium text-slate-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Table</p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.table_number || order.table_id}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Order Type</p>
                <p className="mt-1 font-medium text-slate-900">
                  {order.order_type || "Dine-In"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Date & Time</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatOrderDateTime(order.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_80px_100px_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                <span>Ordered Items</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Item Total</span>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No item details found.
                </div>
              ) : (
                items.map((item) => {
                  const unitPrice = Number(item.price_at_time || 0);
                  const quantity = Number(item.quantity || 0);
                  return (
                    <div
                      key={`${item.menu_item_id}-${item.id || item.name}`}
                      className="grid grid-cols-[1fr_80px_100px_100px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="text-right text-slate-600">{quantity}</span>
                      <span className="text-right text-slate-600">
                        {formatCurrency(unitPrice)}
                      </span>
                      <span className="text-right font-semibold text-slate-900">
                        {formatCurrency(unitPrice * quantity)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST</span>
                <span>{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Final Amount</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Details
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium text-slate-900">Method:</span>{" "}
                    {order.billing_method || "Not selected"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Status:</span>{" "}
                    {order.payment_status}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Amount:</span>{" "}
                    {formatCurrency(finalAmount)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order Timeline
                </p>
                <div className="mt-3 space-y-3">
                  {timeline.map((entry) => (
                    <div key={entry.title} className="flex gap-3">
                      <div
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${entry.active ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {entry.title}
                        </p>
                        <p className="text-xs text-slate-500">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOrderReports() {
  const today = toDateInputValue(new Date());

  const [orders, setOrders] = useState<OrderReportRow[]>([]);
  const [summary, setSummary] = useState<OrderReportSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [orderStatus, setOrderStatus] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("");

  const [detailsOrder, setDetailsOrder] = useState<CafeOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrderReports = useCallback(async () => {
    setLoading(true);

    const response = await tenantApiFetch("/api/admin/reports/order_report", {
      cache: "no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_from: dateFrom,
        date_to: dateTo,
        status: orderStatus,
        table_number: tableNumber,
        payment_method: paymentMethod,
        customer_name: customerName,
        order_type: orderType,
      }),
    });

    const data = (await response.json()) as {
      report?: OrderReportRow[];
      summary?: OrderReportSummary;
    };

    setOrders(data.report || []);
    setSummary(data.summary || computeOrderReportSummary(data.report || []));
    setLoading(false);
  }, [
    dateFrom,
    dateTo,
    orderStatus,
    tableNumber,
    paymentMethod,
    customerName,
    orderType,
  ]);

  useEffect(() => {
    void loadOrderReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((row) => {
      const haystack = [
        row.order_id,
        row.customer_name,
        row.table_number,
        row.order_type,
        row.payment_method,
        row.order_status,
        row.total_items,
        row.order_amount,
        row.net_amount,
        formatOrderDateTime(row.created_at),
      ]
        .filter((value) => value != null && value !== "")
        .map(String)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, search]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((left, right) => {
      const result = compareValues(left[sortKey], right[sortKey]);
      return sortDirection === "asc" ? result : -result;
    });
    return rows;
  }, [filtered, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, sortKey, sortDirection]);

  const exportFilename = useMemo(
    () => `order-report-${dateFrom}-to-${dateTo}`,
    [dateFrom, dateTo]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  function resetFilters() {
    setDateFrom(today);
    setDateTo(today);
    setOrderStatus("");
    setTableNumber("");
    setPaymentMethod("");
    setCustomerName("");
    setOrderType("");
  }

  async function openOrderDetails(row: OrderReportRow) {
    setDetailsOrder({ id: row.id } as CafeOrder);
    setDetailsLoading(true);

    const response = await tenantApiFetch(
      `/api/orders?id=${encodeURIComponent(String(row.id))}`,
      { cache: "no-store" }
    );
    const data = (await response.json()) as OrderResponse;

    if (response.ok && data.order) {
      setDetailsOrder(data.order);
    } else {
      setDetailsOrder(null);
    }

    setDetailsLoading(false);
  }

  function handlePrintReport() {
    const headers = ORDER_REPORT_EXPORT_COLUMNS.map((column) => column.header);
    const rows = sorted.map((row) =>
      ORDER_REPORT_EXPORT_COLUMNS.map((column) =>
        String(column.accessor(row, 0) ?? "")
      )
    );

    const html = buildPrintableTableHtml(
      "Order Report",
      `${dateFrom} to ${dateTo} · ${sorted.length} order(s)`,
      headers,
      rows
    );

    printHtmlReport("Order Report", html);
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown size={14} className="opacity-40" />;
    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  }

  function renderCell(row: OrderReportRow, key: SortKey) {
    switch (key) {
      case "created_at":
        return formatOrderDateTime(row.created_at);
      case "order_amount":
      case "discount":
      case "gst":
      case "net_amount":
        return formatCurrency(row[key]);
      case "order_status":
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.order_status)}`}
          >
            {row.order_status}
          </span>
        );
      default:
        return String(row[key] ?? "-");
    }
  }

  return (
    <AdminGuard>
      <section className="space-y-5">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Order Report Management
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Order Reports
              </h2>
            </div>
            <button
              type="button"
              onClick={loadOrderReports}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard
            label="Total Orders"
            value={String(summary.totalOrders)}
            icon={<ShoppingBag size={18} />}
            tone="slate"
          />
          <SummaryCard
            label="Completed Orders"
            value={String(summary.completedOrders)}
            icon={<CheckCircle2 size={18} />}
            tone="emerald"
          />
          <SummaryCard
            label="Pending Orders"
            value={String(summary.pendingOrders)}
            icon={<Clock3 size={18} />}
            tone="amber"
          />
          <SummaryCard
            label="Cancelled Orders"
            value={String(summary.cancelledOrders)}
            icon={<Ban size={18} />}
            tone="rose"
          />
          <SummaryCard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={<IndianRupee size={18} />}
            tone="blue"
          />
          <SummaryCard
            label="Average Order Value"
            value={formatCurrency(summary.averageOrderValue)}
            icon={<IndianRupee size={18} />}
            tone="emerald"
          />
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order Status
              </label>
              <select
                value={orderStatus}
                onChange={(event) => setOrderStatus(event.target.value)}
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Served">Served</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Table Number
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Search customer..."
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(event) => setOrderType(event.target.value)}
                className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All Types</option>
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadOrderReports}
              className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <ExportDropdown
              data={sorted}
              columns={ORDER_REPORT_EXPORT_COLUMNS}
              filename={exportFilename}
              disabled={loading}
            />
            <button
              type="button"
              onClick={handlePrintReport}
              disabled={loading || sorted.length === 0}
              className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">
              {sorted.length} order{sorted.length !== 1 ? "s" : ""}
            </p>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <tr>
                  {SORTABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 ${column.align || "text-left"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 transition hover:text-emerald-600"
                      >
                        {column.label}
                        {renderSortIcon(column.key)}
                      </button>
                    </th>
                  ))}
                  <th className="border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                      Loading order reports...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50 last:border-b-0"
                    >
                      {SORTABLE_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-slate-700 ${column.align || "text-left"} ${column.key === "order_id" ? "font-semibold text-slate-900" : ""}`}
                        >
                          {renderCell(row, column.key)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openOrderDetails(row)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                          aria-label={`View order ${row.order_id}`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {sorted.length === 0
                  ? "0"
                  : `${(safePage - 1) * pageSize + 1}–${Math.min(
                    safePage * pageSize,
                    sorted.length
                  )}`}{" "}
                of {sorted.length}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <OrderDetailsDialog
        order={detailsOrder}
        loading={detailsLoading}
        onClose={() => {
          setDetailsOrder(null);
          setDetailsLoading(false);
        }}
      />
    </AdminGuard>
  );
}
