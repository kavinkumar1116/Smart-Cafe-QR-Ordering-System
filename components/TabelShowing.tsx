"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Printer, X } from "lucide-react";
import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { useRealtimeTable } from "@/lib/supabase/realtime";
import type { CafeTable, CafeOrder } from "@/types/cafe";
import { useCafeStore } from "@/src/store/useCafeStore";
import jsPDF from "jspdf";
import { formatCurrency } from "@/lib/format";

interface TableShowingProps {
  onTableSelect?: (tableNumber: string | number) => void;
  onTakeAway?: () => void;
}

const formatDateTime = (date: string | Date) => {
  const d = new Date(date);

  return `${d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-")}, ${d.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    })}`;
};

const downloadReceipt = async (
  order: CafeOrder,
  gstPercentage: number,
  billingMethod: string
) => {
  const items = order.items ?? [];

  // Calculate subtotal
  const subTotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price_at_time || 0) *
      Number(item.quantity || 0),
    0
  );

  // GST Calculation
  const gstAmount = (subTotal * gstPercentage) / 100;

  // Final Total
  const total = subTotal + gstAmount;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });

  let y = 10;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("SMART CAFE", 40, y, {
    align: "center",
  });

  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Chennai", 40, y, {
    align: "center",
  });

  y += 8;

  pdf.line(5, y, 75, y);

  y += 6;

  // Order Details
  pdf.text(`Order ID: ${order.order_id}`, 5, y);
  y += 6;

  pdf.text(
    `Date: ${formatDateTime(order.created_at)}`,
    5,
    y
  );
  y += 6;

  pdf.text(
    `Customer: ${order.customer_name}`,
    5,
    y
  );
  y += 6;

  pdf.text(
    `Mobile: ${order.customer_mobile || "-"}`,
    5,
    y
  );
  y += 6;

  pdf.text(
    `Order Type: ${order.order_type === "Dine-In"
      ? `Table ${order.table_number}`
      : "Takeaway"
    }`,
    5,
    y
  );

  y += 6;

  pdf.line(5, y, 75, y);

  y += 6;

  // Item Header
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

    pdf.text(amount.toFixed(2), 70, y, {
      align: "right",
    });

    y += 6;
  });

  y += 2;

  pdf.line(5, y, 75, y);

  y += 8;

  // Summary Section
  pdf.setFont("helvetica", "normal");

  pdf.text(`Subtotal : ${subTotal.toFixed(2)}`, 5, y);
  y += 8;

  pdf.text(`GST (${gstPercentage}%) : ${gstAmount.toFixed(2)}`, 5, y);
  y += 8;

  pdf.line(5, y, 75, y);

  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);

  pdf.text(
    `Grand Total : ${total.toFixed(2)}`,
    5,
    y
  );

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  pdf.text(
    `Billing Method : ${billingMethod}`,
    5,
    y
  );

  y += 12;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);

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

export default function TableShowing({ onTableSelect, onTakeAway }: TableShowingProps) {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [getStatusFromTableOrdes, setGetStatusFromTableOrdes] = useState<CafeOrder[]>([]);
  const tableData = useCafeStore((state) => state.tableData);
  const gstPercentage = useCafeStore((state) => state.gstPercentage);

  // Modal and details loading states
  const [selectedOrders, setSelectedOrders] = useState<CafeOrder[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [modalTableNumber, setModalTableNumber] = useState<number | null>(null);
  const [loadingPrintTable, setLoadingPrintTable] = useState<number | null>(null);

  useEffect(() => {
    if (tableData) {
      setTables(tableData);
    }
  }, [tableData]);

  const getOrdersListData = useCallback(async () => {
    try {
      const response = await tenantApiFetch("/admin/orders", {
        cache: "no-store",
      });

      const data = await response.json();
      if (response.ok && data.orders) {
        setGetStatusFromTableOrdes(data.orders);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    getOrdersListData();
  }, [getOrdersListData]);

  const fetchOrderWithItems = async (orderId: number | string): Promise<CafeOrder | null> => {
    try {
      const response = await tenantApiFetch(`/api/orders?id=${encodeURIComponent(String(orderId))}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.order) {
        return data.order;
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
    return null;
  };

  const handlePrintReceipts = async (tableNumber: number) => {
    if (loadingPrintTable !== null) return;
    setLoadingPrintTable(tableNumber);
    try {
      const tableOrders = getStatusFromTableOrdes.filter(
        (order) =>
          order.payment_status === "Pending" &&
          Number(order.table_number) === Number(tableNumber)
      );
      if (tableOrders.length === 0) return;

      for (const order of tableOrders) {
        const fullOrder = await fetchOrderWithItems(order.id);
        if (fullOrder) {
          await downloadReceipt(fullOrder, gstPercentage, fullOrder.billing_method || "UPI");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrintTable(null);
    }
  };

  const handleViewDetails = async (tableNumber: number) => {
    setModalTableNumber(tableNumber);
    setSelectedOrders([]);
    setIsLoadingDetails(true);
    setShowDetailsModal(true);

    try {
      const tableOrders = getStatusFromTableOrdes.filter(
        (order) =>
          order.payment_status === "Pending" &&
          Number(order.table_number) === Number(tableNumber)
      );

      const fullOrders = await Promise.all(
        tableOrders.map(async (order) => {
          return await fetchOrderWithItems(order.id);
        })
      );
      setSelectedOrders(fullOrders.filter((o): o is CafeOrder => o !== null));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <AdminGuard>
      <section className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-semibold text-emerald-900 sm:text-3xl">
                Table Ordering System
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              {/* Empty Table */}
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full border border-slate-400 bg-white"></span>
                Empty Table
              </span>

              {/* Running Table */}
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-emerald-600"></span>
                Running Table
              </span>

              {/* Take Away */}
              <button
                type="button"
                onClick={onTakeAway}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Take Away
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {tables.map((table) => {
            const isRunning = getStatusFromTableOrdes.some(
              (order) =>
                order.payment_status === "Pending" &&
                Number(order.table_number) === Number(table.table_number)
            );

            return (
              <div
                key={table.id}
                className={`rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                ${
                  isRunning
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTableSelect?.(table.table_number)}
                  className="flex w-full flex-col items-center pt-6"
                >
                  <span
                    className={`text-xs uppercase tracking-widest ${
                      isRunning ? "text-emerald-100" : "text-slate-500"
                    }`}
                  >
                    Table
                  </span>

                  <h2 className="mt-2 text-4xl font-bold">
                    {table.table_number}
                  </h2>
                </button>

                <div className="flex items-center justify-center gap-4 px-4 pb-5 pt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRunning) {
                        handlePrintReceipts(table.table_number);
                      }
                    }}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border transition
                    ${
                      isRunning
                        ? "border-white/60 text-white hover:bg-white hover:text-emerald-600 cursor-pointer"
                        : "pointer-events-none opacity-40 border-slate-200 text-slate-300 cursor-default"
                    }`}
                  >
                    {loadingPrintTable === table.table_number ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Printer size={22} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRunning) {
                        handleViewDetails(table.table_number);
                      }
                    }}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border transition
                    ${
                      isRunning
                        ? "border-white/60 text-white hover:bg-white hover:text-emerald-600 cursor-pointer"
                        : "pointer-events-none opacity-40 border-slate-200 text-slate-300 cursor-default"
                    }`}
                  >
                    <Eye size={22} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal/Popup for table details */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowDetailsModal(false)}
            />

            {/* Modal Box */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-300 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>Table {modalTableNumber} Details</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Running
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active orders on this table
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-sm font-medium text-slate-500">Loading details...</p>
                  </div>
                ) : selectedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 font-medium">No details found for this table.</p>
                  </div>
                ) : (
                  selectedOrders.map((order) => {
                    const items = order.items ?? [];
                    const subTotal = items.reduce(
                      (sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0),
                      0
                    );
                    const gstAmount = (subTotal * gstPercentage) / 100;
                    const total = subTotal + gstAmount;

                    return (
                      <div key={order.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                        {/* Order Header info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                              ID: {order.order_id}
                            </span>
                            <span className="block text-xs text-slate-500 mt-1">
                              {formatDateTime(order.created_at)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-slate-500 block">
                              Billing: {order.billing_method || "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Person details */}
                        <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                              Customer Name
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              {order.customer_name}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                              Contact No
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              {order.customer_mobile || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                          <span className="block text-xs font-semibold text-slate-700">
                            Items Ordered ({items.length})
                          </span>
                          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                            {items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-3 text-sm">
                                <div className="space-y-0.5">
                                  <span className="font-medium text-slate-800 block">
                                    {item.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {item.quantity} x {formatCurrency(item.price_at_time)}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-900">
                                  {formatCurrency(Number(item.price_at_time || 0) * Number(item.quantity || 0))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pricing summary */}
                        <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2 text-sm">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subTotal)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>GST ({gstPercentage}%)</span>
                            <span>{formatCurrency(gstAmount)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2 text-base">
                            <span>Grand Total</span>
                            <span className="text-emerald-700">{formatCurrency(total)}</span>
                          </div>
                        </div>

                        {/* Actions per order */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => downloadReceipt(order, gstPercentage, order.billing_method || "UPI")}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <Printer size={14} />
                            <span>Print Receipt</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                {selectedOrders.length > 0 && !isLoadingDetails && (
                  <button
                    type="button"
                    onClick={() => {
                      selectedOrders.forEach((o) => downloadReceipt(o, gstPercentage, o.billing_method || "UPI"));
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    <Printer size={16} />
                    <span>Print All Receipts</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminGuard>
  );
}