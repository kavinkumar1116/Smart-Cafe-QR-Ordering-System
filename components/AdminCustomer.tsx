"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { useRealtimeTable } from "@/lib/supabase/realtime";

import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type {
  CafeOrder,
  OrdersResponse,
} from "@/types/cafe";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AdminOrders() {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [pageSize, setPageSize] = useState(10);

  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/orders", {
      cache: "no-store",
    });

    const data = (await response.json()) as OrdersResponse;

    setOrders(data.orders || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useRealtimeTable({ table: "orders", onChange: loadOrders });

  // SEARCH FILTER
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

  return (
    <AdminGuard>
      <section className="space-y-5">
        {/* HEADER */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Customer Management
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Customers
              </h2>
            </div>

            <button
              onClick={loadOrders}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">
              {filtered.length} customer
              {filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search customers..."
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

                  <th className="w-40 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Order ID
                  </th>

                  <th className="w-52 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Customer
                  </th>

                  <th className="w-44 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Contact
                  </th>

                  <th className="w-24 border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Table
                  </th>

                  <th className="w-52 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Date
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
                      Loading customers...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((order, idx) => (
                    <tr
                      key={order.id}
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
                        {order.order_id}
                      </td>

                      {/* CUSTOMER */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {order.customer_name}
                      </td>

                      {/* CONTACT */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {order.customer_mobile}
                      </td>

                      {/* TABLE */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {order.table_number || order.table_id}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {new Date(
                          order.created_at
                        )
                          .toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })
                          .replace(",", "")}
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
                  : `${
                      (safePage - 1) *
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
