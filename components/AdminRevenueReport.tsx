"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Search,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Award,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CalendarDays
} from "lucide-react";
import { tenantApiFetch } from "@/lib/tenant";
import { formatCurrency } from "@/lib/format";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Helper to format Date objects to YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

interface OrderWithItems {
  id: number;
  order_id: string;
  total_amount: number | string;
  created_at: string;
  status: string;
  order_type: string;
  billing_method: string | null;
  payment_status: string;
  customer_name: string;
  customer_mobile: string;
  order_items: {
    id: number;
    quantity: number;
    price_at_time: number | string;
    menu_items: {
      name: string;
    } | null;
  }[];
}

export default function AdminRevenueReport() {
  const todayStr = formatDateString(new Date());

  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState("today");

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Search and pagination for top selling items
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch report data from API
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await tenantApiFetch("/api/admin/reports/revenue_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_from: dateFrom,
          date_to: dateTo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load revenue data");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while fetching report data.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Initial and range change load
  useEffect(() => {
    void fetchReport();
  }, [dateFrom, dateTo]);

  // Set ranges for quick filters
  const handleQuickFilter = (type: string) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    switch (type) {
      case "today":
        break;
      case "yesterday":
        from.setDate(now.getDate() - 1);
        to.setDate(now.getDate() - 1);
        break;
      case "this_week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        from = new Date(now.setDate(diff));
        to = new Date();
        break;
      }
      case "last_week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
        from = new Date(now.setDate(diff));
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      }
      case "this_month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date();
        break;
      case "last_month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        return;
    }

    setDateFrom(formatDateString(from));
    setDateTo(formatDateString(to));
    setSelectedQuickFilter(type);
  };

  // Filter completed/served orders list for revenue calculations
  const completedOrdersList = useMemo(() => {
    return orders.filter(
      (o) => o.status === "Served" || o.status === "Paid" || o.payment_status === "Paid"
    );
  }, [orders]);

  // 1. Revenue Trend line chart data
  const trendChartData = useMemo(() => {
    if (orders.length === 0) return [];

    const dateDiff = Math.ceil(
      (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dateDiff <= 1) {
      // Group by hour (for single day reports)
      const hourlyMap: Record<number, number> = {};
      for (let i = 8; i <= 22; i++) hourlyMap[i] = 0;

      completedOrdersList.forEach((order) => {
        const date = new Date(order.created_at);
        const hour = date.getHours();
        if (hour >= 8 && hour <= 22) {
          hourlyMap[hour] += Number(order.total_amount || 0);
        }
      });

      return Object.entries(hourlyMap).map(([hour, value]) => ({
        label: `${hour.padStart(2, "0")}:00`,
        revenue: value,
      }));
    } else if (dateDiff <= 31) {
      // Group by day
      const dailyMap: Record<string, number> = {};
      const start = new Date(dateFrom);
      const end = new Date(dateTo);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dailyMap[formatDateString(d)] = 0;
      }

      completedOrdersList.forEach((order) => {
        const dateKey = order.created_at.slice(0, 10);
        if (dailyMap[dateKey] !== undefined) {
          dailyMap[dateKey] += Number(order.total_amount || 0);
        }
      });

      return Object.entries(dailyMap).map(([date, value]) => {
        const d = parseDateOnly(date);
        return {
          label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          rawDate: date,
          revenue: value,
        };
      });
    } else {
      // Group by month
      const monthlyMap: Record<string, number> = {};
      const start = new Date(dateFrom);
      const end = new Date(dateTo);

      for (
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        d <= end;
        d.setMonth(d.getMonth() + 1)
      ) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[key] = 0;
      }

      completedOrdersList.forEach((order) => {
        const key = order.created_at.slice(0, 7);
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += Number(order.total_amount || 0);
        }
      });

      return Object.entries(monthlyMap).map(([monthKey, value]) => {
        const [year, month] = monthKey.split("-").map(Number);
        const d = new Date(year, month - 1, 1);
        return {
          label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
          rawDate: monthKey,
          revenue: value,
        };
      });
    }
  }, [completedOrdersList, dateFrom, dateTo, orders.length]);

  // 2. Revenue by Order Type Donut
  const orderTypeData = useMemo(() => {
    let dineInOrders = 0;
    let dineInRevenue = 0;
    let takeAwayOrders = 0;
    let takeAwayRevenue = 0;

    orders.forEach((order) => {
      const isDineIn = /dine/i.test(order.order_type || "");
      const isCompleted =
        order.status === "Served" || order.status === "Paid" || order.payment_status === "Paid";

      if (isDineIn) {
        dineInOrders += 1;
        if (isCompleted) dineInRevenue += Number(order.total_amount || 0);
      } else {
        takeAwayOrders += 1;
        if (isCompleted) takeAwayRevenue += Number(order.total_amount || 0);
      }
    });

    const totalRevenue = dineInRevenue + takeAwayRevenue;

    return [
      {
        name: "Dine In",
        value: dineInRevenue,
        orders: dineInOrders,
        percentage: totalRevenue > 0 ? `${Math.round((dineInRevenue / totalRevenue) * 100)}%` : "0%",
        color: "#10b981", // Emerald 500
      },
      {
        name: "Take Away",
        value: takeAwayRevenue,
        orders: takeAwayOrders,
        percentage: totalRevenue > 0 ? `${Math.round((takeAwayRevenue / totalRevenue) * 100)}%` : "0%",
        color: "#3b82f6", // Blue 500
      },
    ];
  }, [orders]);

  // 3. Payment Method donut chart
  const paymentMethodData = useMemo(() => {
    let cashOrders = 0;
    let cashRevenue = 0;
    let upiOrders = 0;
    let upiRevenue = 0;

    orders.forEach((order) => {
      const isUpi =
        /upi|gpay|phonepe|paytm|online|card/i.test(order.billing_method || "") ||
        (order.payment_status === "Paid" && !/cash/i.test(order.billing_method || ""));
      const isCompleted =
        order.status === "Served" || order.status === "Paid" || order.payment_status === "Paid";

      if (isUpi) {
        upiOrders += 1;
        if (isCompleted) upiRevenue += Number(order.total_amount || 0);
      } else {
        cashOrders += 1;
        if (isCompleted) cashRevenue += Number(order.total_amount || 0);
      }
    });

    const totalRevenue = cashRevenue + upiRevenue;

    return [
      {
        name: "UPI",
        value: upiRevenue,
        orders: upiOrders,
        percentage: totalRevenue > 0 ? `${Math.round((upiRevenue / totalRevenue) * 100)}%` : "0%",
        color: "#8b5cf6", // Violet 500
      },
      {
        name: "Cash",
        value: cashRevenue,
        orders: cashOrders,
        percentage: totalRevenue > 0 ? `${Math.round((cashRevenue / totalRevenue) * 100)}%` : "0%",
        color: "#f59e0b", // Amber 500
      },
    ];
  }, [orders]);

  // 4. Top Selling Items calculation
  const topSellingItems = useMemo(() => {
    const itemsMap: Record<string, { quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      const isCompleted =
        order.status === "Served" || order.status === "Paid" || order.payment_status === "Paid";
      if (!isCompleted) return;

      const orderItems = order.order_items || [];
      orderItems.forEach((item) => {
        const name = item.menu_items?.name || "Unnamed Item";
        const qty = Number(item.quantity || 0);
        const price = Number(item.price_at_time || 0);

        if (!itemsMap[name]) {
          itemsMap[name] = { quantity: 0, revenue: 0 };
        }
        itemsMap[name].quantity += qty;
        itemsMap[name].revenue += qty * price;
      });
    });

    const itemsList = Object.entries(itemsMap).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
    }));

    // Sort by revenue descending
    itemsList.sort((a, b) => b.revenue - a.revenue);

    return itemsList.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }, [orders]);

  // 5. Best & Worst Performance KPI calculation
  const performanceSummary = useMemo(() => {
    const dailyStats: Record<string, { revenue: number; ordersCount: number; dateObj: Date }> = {};

    orders.forEach((order) => {
      const dateKey = order.created_at.slice(0, 10);
      const isCompleted =
        order.status === "Served" || order.status === "Paid" || order.payment_status === "Paid";

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { revenue: 0, ordersCount: 0, dateObj: new Date(order.created_at) };
      }

      dailyStats[dateKey].ordersCount += 1;
      if (isCompleted) {
        dailyStats[dateKey].revenue += Number(order.total_amount || 0);
      }
    });

    const statsList = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      dayName: stats.dateObj.toLocaleDateString("en-IN", { weekday: "long" }),
      formattedDate: stats.dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: stats.revenue,
      ordersCount: stats.ordersCount,
    }));

    if (statsList.length === 0) {
      return {
        highestRevenueDay: { day: "-", value: 0 },
        lowestRevenueDay: { day: "-", value: 0 },
        highestOrders: { day: "-", value: 0 },
        lowestOrders: { day: "-", value: 0 },
      };
    }

    const sortedByRevenue = [...statsList].sort((a, b) => b.revenue - a.revenue);
    const highestRevenueDay = {
      day: `${sortedByRevenue[0].dayName} (${sortedByRevenue[0].formattedDate})`,
      value: sortedByRevenue[0].revenue,
    };

    const positiveRevenue = statsList.filter((s) => s.revenue > 0);
    const lowestRevenueSource = positiveRevenue.length > 0 ? positiveRevenue : statsList;
    const sortedByRevenueAsc = [...lowestRevenueSource].sort((a, b) => a.revenue - b.revenue);
    const lowestRevenueDay = {
      day: `${sortedByRevenueAsc[0].dayName} (${sortedByRevenueAsc[0].formattedDate})`,
      value: sortedByRevenueAsc[0].revenue,
    };

    const sortedByOrders = [...statsList].sort((a, b) => b.ordersCount - a.ordersCount);
    const highestOrders = {
      day: `${sortedByOrders[0].dayName} (${sortedByOrders[0].formattedDate})`,
      value: sortedByOrders[0].ordersCount,
    };

    const sortedByOrdersAsc = [...statsList].sort((a, b) => a.ordersCount - b.ordersCount);
    const lowestOrders = {
      day: `${sortedByOrdersAsc[0].dayName} (${sortedByOrdersAsc[0].formattedDate})`,
      value: sortedByOrdersAsc[0].ordersCount,
    };

    return {
      highestRevenueDay,
      lowestRevenueDay,
      highestOrders,
      lowestOrders,
    };
  }, [orders]);

  // Item Search filter
  const filteredItems = useMemo(() => {
    return topSellingItems.filter((item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [topSellingItems, itemSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const startIdx = (itemPage - 1) * itemsPerPage;
    return filteredItems.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredItems, itemPage]);

  // Export data to multi-sheet Excel file
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Revenue Trend
    const trendRows = [
      ["Date / Label", "Revenue (INR)"],
      ...trendChartData.map((d) => [d.label, d.revenue]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(trendRows), "Revenue Trend");

    // Sheet 2: Revenue by Order Type
    const typeRows = [
      ["Order Type", "OrdersCount", "Revenue (INR)", "Percentage"],
      ...orderTypeData.map((d) => [d.name, d.orders, d.value, d.percentage]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(typeRows), "Revenue by Order Type");

    // Sheet 3: Payment Method
    const payRows = [
      ["Payment Method", "OrdersCount", "Revenue (INR)", "Percentage"],
      ...paymentMethodData.map((d) => [d.name, d.orders, d.value, d.percentage]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(payRows), "Payment Method");

    // Sheet 4: Top Selling Items
    const topItemsRows = [
      ["Rank", "Item", "Quantity Sold", "Revenue (INR)"],
      ...topSellingItems.map((d) => [d.rank, d.name, d.quantity, d.revenue]),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(topItemsRows), "Top Selling Items");

    // Sheet 5: Performance Summary
    const summaryRows = [
      ["Metric", "Value"],
      ["Highest Revenue Day", `${performanceSummary.highestRevenueDay.day} - ₹${performanceSummary.highestRevenueDay.value.toLocaleString("en-IN")}`],
      ["Lowest Revenue Day", `${performanceSummary.lowestRevenueDay.day} - ₹${performanceSummary.lowestRevenueDay.value.toLocaleString("en-IN")}`],
      ["Highest Orders Day", `${performanceSummary.highestOrders.day} - ${performanceSummary.highestOrders.value} Orders`],
      ["Lowest Orders Day", `${performanceSummary.lowestOrders.day} - ${performanceSummary.lowestOrders.value} Orders`],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Performance Summary");

    XLSX.writeFile(workbook, `Revenue_Report_${todayStr}.xlsx`);
  };

  // Quick filter options config
  const quickFilters = [
    { type: "today", label: "Today" },
    { type: "yesterday", label: "Yesterday" },
    { type: "this_week", label: "This Week" },
    { type: "last_week", label: "Last Week" },
    { type: "this_month", label: "This Month" },
    { type: "last_month", label: "Last Month" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Filters Sticky Panel */}
      <div className="sticky top-[73px] z-20 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilters.map((q) => (
              <button
                key={q.type}
                type="button"
                onClick={() => handleQuickFilter(q.type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedQuickFilter === q.type
                    ? "bg-emerald-600 text-black shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {q.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedQuickFilter("custom")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedQuickFilter === "custom"
                  ? "bg-emerald-600 text-black shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Custom Date
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setSelectedQuickFilter("custom");
                  }}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <div className="relative">
                <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setSelectedQuickFilter("custom");
                  }}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                title="Refresh Report"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFrom(todayStr);
                  setDateTo(todayStr);
                  setSelectedQuickFilter("today");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading || orders.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} className="text-white"/>
                <span className="text-white">Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={16} />
            Error Loading Report
          </div>
          <p className="mt-1 text-xs opacity-90">{errorMsg}</p>
        </div>
      )}

      {/* KPI Performance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{marginTop:"60px"}}>
        {/* Highest Revenue Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Highest Revenue Day
              </span>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {loading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  performanceSummary.highestRevenueDay.day
                )}
              </h4>
              <p className="text-xs text-slate-500">
                Peak financial collection in a single day
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Amount Collected</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {loading ? (
                <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                formatCurrency(performanceSummary.highestRevenueDay.value)
              )}
            </span>
          </div>
        </div>

        {/* Lowest Revenue Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Lowest Revenue Day
              </span>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {loading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  performanceSummary.lowestRevenueDay.day
                )}
              </h4>
              <p className="text-xs text-slate-500">
                Lowest financial collection day
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Amount Collected</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {loading ? (
                <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                formatCurrency(performanceSummary.lowestRevenueDay.value)
              )}
            </span>
          </div>
        </div>

        {/* Highest Orders Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Highest Orders Day
              </span>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {loading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  performanceSummary.highestOrders.day
                )}
              </h4>
              <p className="text-xs text-slate-500">
                Most busy day by order count
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Orders Fulfilled</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {loading ? (
                <div className="h-5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                `${performanceSummary.highestOrders.value} Orders`
              )}
            </span>
          </div>
        </div>

        {/* Lowest Orders Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Lowest Orders Day
              </span>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {loading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  performanceSummary.lowestOrders.day
                )}
              </h4>
              <p className="text-xs text-slate-500">
                Least busy day by order count
              </p>
            </div>
            <div className="rounded-lg bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Orders Fulfilled</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {loading ? (
                <div className="h-5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                `${performanceSummary.lowestOrders.value} Orders`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Tables Dashboard */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Column: Revenue Trend Line Chart & Top Selling Items Table */}
        <div className="space-y-6 xl:col-span-2">
          {/* Revenue Trend Line Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Visual history of cafe earnings</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold dark:text-emerald-400">
                <TrendingUp size={14} />
                Live Graph
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[300px] items-center justify-center bg-slate-50/50 rounded-xl animate-pulse dark:bg-slate-900/50">
                  <span className="text-sm text-slate-400">Loading chart data...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/20">
                  <TrendingUp size={36} className="text-slate-300 dark:text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-400">
                    No Sales Data Available
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try choosing a different date range or place some test orders.
                  </p>
                </div>
              ) : isMounted ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <RechartsTooltip
                        cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-950">
                                <p className="text-xs font-semibold text-white dark:text-white">
                                  {label}
                                </p>
                                <p className="mt-1 text-sm font-white text-slate-900 dark:text-white">
                                  {formatCurrency(Number(payload[0].value || 0))}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981" // emerald-500
                        strokeWidth={3}
                        dot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: "#ffffff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Top Selling Items searchable table */}
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Most popular menu items by sales volume and cash</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-white-500 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-3.5 font-bold text-black">Rank</th>
                      <th className="px-6 py-3.5 font-bold text-black">Item Name</th>
                      <th className="px-6 py-3.5 font-bold text-right text-black">Quantity Sold</th>
                      <th className="px-6 py-3.5 font-bold text-right text-black">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-6 bg-slate-200 rounded dark:bg-slate-800" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded dark:bg-slate-800" /></td>
                          <td className="px-6 py-4 text-right"><div className="h-4 w-12 ml-auto bg-slate-200 rounded dark:bg-slate-800" /></td>
                          <td className="px-6 py-4 text-right"><div className="h-4 w-20 ml-auto bg-slate-200 rounded dark:bg-slate-800" /></td>
                        </tr>
                      ))
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Utensils size={30} className="text-slate-300 dark:text-slate-700" />
                            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-400">
                              No items found
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr key={item.rank} className="hover:bg-slate-50/50 transition dark:hover:bg-slate-900/20">
                          <td className="px-6 py-4">
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              item.rank === 1 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-black"
                                : item.rank === 2
                                ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                : item.rank === 3
                                ? "bg-orange-100 text-orange-850 dark:bg-orange-950/20 dark:text-orange"
                                : "text-slate-600 dark:text-slate-400"
                            }`}>
                              {item.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-black">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-black">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-950 dark:text-black">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {!loading && filteredItems.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold">{(itemPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-semibold">
                      {Math.min(itemPage * itemsPerPage, filteredItems.length)}
                    </span>{" "}
                    of <span className="font-semibold">{filteredItems.length}</span> items
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={itemPage === 1}
                      onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={itemPage === totalPages}
                      onClick={() => setItemPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Donut charts */}
        <div className="space-y-6">
          {/* Revenue by Order Type Donut */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Order Type</CardTitle>
              <CardDescription>Comparison of Dine In vs Take Away channels</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <div className="flex h-[200px] w-full items-center justify-center bg-slate-50/50 rounded-xl animate-pulse dark:bg-slate-900/50">
                  <span className="text-sm text-slate-400">Loading chart...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
                  <ShoppingBag size={24} className="text-slate-350 dark:text-slate-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">No Sales Data</p>
                </div>
              ) : isMounted ? (
                <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-around xl:flex-col">
                  {/* Pie Chart visual */}
                  <div className="relative h-[160px] w-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total Revenue
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-black">
                        ₹
                        {orderTypeData
                          .reduce((sum, item) => sum + item.value, 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Detail legends list */}
                  <div className="w-full space-y-3.5">
                    {orderTypeData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-black">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.orders} orders placed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-slate-950 dark:text-black">
                            {formatCurrency(item.value)}
                          </p>
                          <span className="inline-block rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.percentage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Payment Method donut chart */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Breakdown of UPI vs Cash revenue collection</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <div className="flex h-[200px] w-full items-center justify-center bg-slate-50/50 rounded-xl animate-pulse dark:bg-slate-900/50">
                  <span className="text-sm text-slate-400">Loading chart...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
                  <CreditCard size={24} className="text-slate-350 dark:text-slate-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">No Sales Data</p>
                </div>
              ) : isMounted ? (
                <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-around xl:flex-col">
                  {/* Pie Chart visual */}
                  <div className="relative h-[160px] w-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total Collected
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-black">
                        ₹
                        {paymentMethodData
                          .reduce((sum, item) => sum + item.value, 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Detail legends list */}
                  <div className="w-full space-y-3.5">
                    {paymentMethodData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-black">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.orders} orders placed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-slate-950 dark:text-black">
                            {formatCurrency(item.value)}
                          </p>
                          <span className="inline-block rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.percentage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
