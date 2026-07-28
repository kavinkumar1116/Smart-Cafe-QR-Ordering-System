"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AdminGuard from "@/components/AdminGuard";
import ExportDropdown, {
  type ExportColumn,
} from "@/components/common/ExportDropdown";
import { tenantApiFetch } from "@/lib/tenant";

import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type SalesReport = {
  id?: string | number;
  order_id?: string;
  table_number?: string | number;
  total_amount?: string | number;
  gst_amount?: string | number;
  order_type?: string;
  created_at?: string;
};

function formatReportDate(date: string) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const SALES_REPORT_EXPORT_COLUMNS: ExportColumn<SalesReport>[] = [
  { header: "SI.No", accessor: (_report, index) => index + 1 },
  {
    header: "Date",
    accessor: (report) =>
      report.created_at ? formatReportDate(report.created_at) : "",
  },
  { header: "Order ID", accessor: (report) => report.order_id ?? "" },
  { header: "Table No", accessor: (report) => report.table_number ?? "" },
  { header: "Amount", accessor: (report) => report.total_amount ?? "" },
  {
    header: "GST",
    accessor: (report) => report.gst_amount ?? "15%",
  },
  { header: "Total Amount", accessor: (report) => report.total_amount ?? "" },
  { header: "Order Type", accessor: (report) => report.order_type ?? "" },
];

export default function AdminReports() {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [orderType, setOrderType] = useState("");
  const [getDate, setDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const loadSalesReports = useCallback(async () => {
    setLoading(true);

    const Get_date = getDate || new Date().toLocaleDateString("en-CA");
    const Get_orderType = orderType;
    const Get_invoiceNo = invoiceNo.trim();

    const response = await tenantApiFetch("/api/admin/reports/sales_report", {
      cache: "no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: Get_orderType,
        date: Get_date,
        invoice_no: Get_invoiceNo,
      }),
    });

    const data = (await response.json()) as { report?: SalesReport[] };
    setReports(data.report || []);
    setLoading(false);
  }, [orderType, getDate, invoiceNo]);

  useEffect(() => {
    void loadSalesReports();
    // Initial load only; Search/Refresh use the latest filter values via onClick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;

    return reports.filter((report) => {
      const haystack = [
        report.order_id,
        report.table_number,
        report.order_type,
        report.total_amount,
        report.gst_amount,
        report.created_at,
        report.id,
      ]
        .filter((value) => value != null && value !== "")
        .map(String)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [reports, search]);

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const exportFilename = useMemo(() => {
    const datePart = getDate || new Date().toLocaleDateString("en-CA");
    return `sales-report-${datePart}`;
  }, [getDate]);

  return (
    <AdminGuard>
      <section className="space-y-5">
        {/* HEADER */}
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Sales Report Management
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Sales Reports
              </h2>
            </div>

            <button
              onClick={loadSalesReports}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            {/* Filters */}
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

              {/* Order Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All Orders</option>
                  <option value="Dine-In">Dine-In</option>
                  <option value="Takeaway">Take-Away</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sales Date
                </label>
                <input
                  type="date"
                  value={getDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* Search Invoice */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice No
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Search invoice..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">

              <button
                onClick={loadSalesReports}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                Search
              </button>

              <button
                onClick={() => {
                  setOrderType("");
                  setDate("");
                  setInvoiceNo("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>

              <ExportDropdown
                data={filtered}
                columns={SALES_REPORT_EXPORT_COLUMNS}
                filename={exportFilename}
                disabled={loading}
              />

            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">
              {filtered.length} report
              {filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-16 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    SI.No
                  </th>

                  <th className="w-52 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Date
                  </th>

                  <th className="w-40 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Order ID
                  </th>

                  <th className="w-52 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Table No
                  </th>

                  <th className="w-44 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Amount
                  </th>

                  <th className="w-24 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    GST
                  </th>

                  <th className="w-24 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Total Amount
                  </th>

                  <th className="w-24 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Order Type
                  </th>
                  <th className="w-24 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Loading sales reports...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No sales reports found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((report, idx) => (
                    <tr
                      key={report.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50 last:border-b-0"
                    >
                      {/* SI.NO */}
                      <td className="px-4 py-3 text-center text-sm text-slate-500">
                        {(safePage - 1) *
                          pageSize +
                          idx +
                          1}
                      </td>

                      {/* ORDER ID */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatReportDate(report.created_at ?? "")}
                      </td>

                      {/* CUSTOMER */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {report.order_id}
                      </td>

                      {/* CONTACT */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {report.table_number}
                      </td>

                      {/* TABLE */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {report.total_amount}
                        </span>
                      </td>

                      {/* GST */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {report.gst_amount ? report.gst_amount : "15%"}
                      </td>

                      {/* DISCOUNT AMOUNT */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {report.total_amount}
                      </td>

                      {/* DISCOUNT AMOUNT */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {report.order_type}
                      </td>

                      {/* ACTIONS */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            {/* PAGE SIZE */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page</span>

              <select
                value={pageSize}
                onChange={(e) =>
                  setPageSize(
                    Number(e.target.value)
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option
                    key={n}
                    value={n}
                  >
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {filtered.length === 0
                  ? "0"
                  : `${(safePage - 1) *
                  pageSize +
                  1
                  }–${Math.min(
                    safePage * pageSize,
                    filtered.length
                  )}`}{" "}
                of {filtered.length}
              </span>

              {/* PREVIOUS */}
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.max(1, p - 1)
                  )
                }
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {/* NEXT */}
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(
                      totalPages,
                      p + 1
                    )
                  )
                }
                disabled={
                  safePage === totalPages
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </AdminGuard>
  );
}
