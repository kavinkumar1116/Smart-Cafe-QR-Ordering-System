"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
import { tenantApiFetch } from "@/lib/tenant";
import { useRealtimeTable } from "@/lib/supabase/realtime";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Truck,
  UsersRound,
  Utensils,
  RefreshCw,
  MoreVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ChartDatum, CustomRange } from "@/types/cafe";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCafeStore } from "@/src/store/useCafeStore";

type DateFilter = "Today" | "Yesterday" | "This Week" | "This Month" | "Custom Date Range";
type StatTone = "emerald" | "blue" | "amber" | "rose";

interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  insideOrders: number;
  outsideOrders: number;
  pendingOrders: number;
  completedOrders: number;
  customerCount: number;
  peakSalesTime: string;
  peakSalesAmount: number;
}

interface RevenueTrendDatum extends ChartDatum {
  date: string;
}

interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

interface DashboardPayload {
  metrics: DashboardMetrics;
  charts: {
    channelComparison: ChartDatum[];
    hourlySales: ChartDatum[];
    revenueTrend: RevenueTrendDatum[];
  };
  error?: string;
  detail?: string;
}

const filterOptions: DateFilter[] = ["Today", "Yesterday", "This Week", "This Month", "Custom Date Range"];
const defaultMetrics: DashboardMetrics = {
  totalOrders: 0,
  totalRevenue: 0,
  insideOrders: 0,
  outsideOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  customerCount: 0,
  peakSalesTime: "08:00",
  peakSalesAmount: 0,
};

const defaultDashboard: DashboardPayload = {
  metrics: defaultMetrics,
  charts: {
    channelComparison: [
      { label: "Dine-in", value: 0, color: "#10b981" },
      { label: "Takeaway", value: 0, color: "#3b82f6" },
      { label: "Delivery", value: 0, color: "#f59e0b" },
    ],
    hourlySales: Array.from({ length: 14 }, (_, index) => ({
      label: `${String(index + 8).padStart(2, "0")}:00`,
      value: 0,
    })),
    revenueTrend: [],
  },
};

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeDateInput(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toDateInputValue(new Date());
}

function getDashboardDateRange(filter: DateFilter, customRange: CustomRange): DashboardDateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayValue = toDateInputValue(today);

  if (filter === "Yesterday") {
    const yesterday = toDateInputValue(addLocalDays(today, -1));
    return { startDate: yesterday, endDate: yesterday };
  }

  if (filter === "This Week") {
    const weekStart = addLocalDays(today, -today.getDay());
    const weekEnd = addLocalDays(weekStart, 6);
    return { startDate: toDateInputValue(weekStart), endDate: toDateInputValue(weekEnd) };
  }

  if (filter === "This Month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: toDateInputValue(monthStart),
      endDate: toDateInputValue(monthEnd),
    };
  }

  if (filter === "Custom Date Range" && customRange.from && customRange.to) {
    const from = normalizeDateInput(customRange.from);
    const to = normalizeDateInput(customRange.to);
    return from <= to ? { startDate: from, endDate: to } : { startDate: to, endDate: from };
  }

  return { startDate: todayValue, endDate: todayValue };
}

function getInitialCustomRange(): CustomRange {
  const today = new Date();
  return {
    from: toDateInputValue(today),
    to: toDateInputValue(today),
  };
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  change?: number;
  helper: string;
  icon: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
}

const StatCard = memo(function StatCard({
  title,
  value,
  change,
  helper,
  icon: Icon,
  tone = "emerald",
  loading,
}: StatCardProps) {
  const toneClasses: Record<StatTone, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <Card variant="elevated">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? (
                <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
              ) : (
                value
              )}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {change >= 0 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">+{change}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 text-rose-600" />
                      <span className="text-xs font-medium text-rose-600">{change}%</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500">{helper}</p>
            </div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${toneClasses[tone]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface ChartProps<T extends ChartDatum = ChartDatum> {
  data: T[];
  loading?: boolean;
}

function EmptyChartState({ loading }: { loading?: boolean }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
      {loading ? "Loading analytics..." : "No data available"}
    </div>
  );
}

const BarChart = memo(function BarChart({ data, loading }: ChartProps) {
  const max = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);
  if (!max) return <EmptyChartState loading={loading} />;

  return (
    <div className="flex h-64 items-end gap-1 sm:gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:shadow-lg"
            style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
            title={`${item.label}: ${formatCurrency(item.value)}`}
          />
          <span className="max-w-full truncate text-xs text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
});

const LineChart = memo(function LineChart({ data, loading }: ChartProps<RevenueTrendDatum>) {
  const width = 640;
  const height = 220;
  const max = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);
  const points = useMemo(
    () =>
      data.map((item, index) => {
        const x = data.length === 1 ? width / 2 : (index / Math.max(data.length - 1, 1)) * width;
        const y = height - (item.value / Math.max(max, 1)) * (height - 20) - 10;
        return { ...item, x, y };
      }),
    [data, max]
  );
  const path = useMemo(
    () => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "),
    [points]
  );

  if (!data.length || !max) return <EmptyChartState loading={loading} />;

  return (
    <div className="overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
        <defs>
          <linearGradient id="revenueLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#revenueLine)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-slate-600 sm:grid-cols-7">
        {data.map((item) => (
          <span key={item.label} className="truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
});

const DonutChart = memo(function DonutChart({ data, loading }: ChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const segments = useMemo(
    () =>
      data.reduce(
        (result: { offset: number; items: Array<ChartDatum & { dash: number; offset: number }> }, item) => {
          const dash = total ? (item.value / total) * 100 : 0;
          return {
            offset: result.offset - dash,
            items: [...result.items, { ...item, dash, offset: result.offset }],
          };
        },
        { offset: 25, items: [] }
      ).items,
    [data, total]
  );

  if (!total) return <EmptyChartState loading={loading} />;

  const colorMap: Record<string, string> = {
    "Dine-in": "#10b981",
    "Takeaway": "#3b82f6",
    "Delivery": "#f59e0b",
  };

  return (
    <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-40 w-40 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="6" />
        {segments.map((item, idx) => (
          <circle
            key={item.label}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={colorMap[item.label] || item.color}
            strokeWidth="6"
            strokeDasharray={`${item.dash} ${100 - item.dash}`}
            strokeDashoffset={item.offset}
            className="transition-all duration-500"
          />
        ))}
      </svg>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorMap[item.label] || item.color }}
              />
              {item.label}
            </span>
            <span className="font-semibold text-slate-900">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [customRange, setCustomRange] = useState<CustomRange>(() => getInitialCustomRange());
  const [dashboard, setDashboard] = useState<DashboardPayload>(defaultDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);  
  const subscriptionExpiringDate = useCafeStore((state) => state.subscriptionExpiringDate);
  const subscriptionStatus = useCafeStore((state) => state.subscriptionStatus);

  const selectedRange = useMemo(() => getDashboardDateRange(dateFilter, customRange), [customRange, dateFilter]);
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate,
    });
    return params.toString();
  }, [selectedRange]);

  const refreshDashboard = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useRealtimeTable({ table: "orders", onChange: refreshDashboard });

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await tenantApiFetch(`/api/admin/dashboard?${queryString}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as DashboardPayload;

        if (!response.ok) {
          throw new Error(data.detail || data.error || "Unable to load dashboard analytics");
        }

        setDashboard(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard analytics");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [queryString, refreshVersion]);

  const metrics = dashboard.metrics;

  return (
    <AdminGuard>
      <div className="space-y-6">
        {/* Filter Section */}
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Select a date range to view metrics</CardDescription>
              </div>
              <button
                onClick={refreshDashboard}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDateFilter(filter)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    dateFilter === filter
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {dateFilter === "Custom Date Range" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">From Date</label>
                  <input
                    type="date"
                    value={customRange.from}
                    max={customRange.to}
                    onChange={(event) => setCustomRange((range) => ({ ...range, from: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">To Date</label>
                  <input
                    type="date"
                    value={customRange.to}
                    min={customRange.from}
                    onChange={(event) => setCustomRange((range) => ({ ...range, to: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={metrics.totalOrders}
            change={5}
            helper="from last period"
            icon={ShoppingBag}
            tone="emerald"
            loading={loading}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            change={12}
            helper="from last period"
            icon={CreditCard}
            tone="blue"
            loading={loading}
          />
          <StatCard
            title="Completed Orders"
            value={metrics.completedOrders}
            change={8}
            helper="from last period"
            icon={CheckCircle2}
            tone="emerald"
            loading={loading}
          />
          <StatCard
            title="Customers"
            value={metrics.customerCount}
            change={3}
            helper="from last period"
            icon={UsersRound}
            tone="blue"
            loading={loading}
          />
          <StatCard
            title="Dine-in Orders"
            value={metrics.insideOrders}
            helper="inside orders"
            icon={Utensils}
            tone="amber"
            loading={loading}
          />
          <StatCard
            title="Takeaway Orders"
            value={metrics.outsideOrders}
            helper="outside orders"
            icon={Truck}
            tone="rose"
            loading={loading}
          />
          <StatCard
            title="Pending Orders"
            value={metrics.pendingOrders}
            helper="awaiting preparation"
            icon={Clock3}
            tone="amber"
            loading={loading}
          />
         <StatCard
  title="Store Status"
  value={
    <span
      className={
        subscriptionStatus === "Active"
          ? "text-green-600 font-semibold"
          : "text-red-600 font-semibold"
      }
    >
      {subscriptionStatus}
    </span>
  }
  helper="subscription status"
  icon={TrendingUp}
  tone="emerald"
  loading={loading}
/>
                  </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily sales trend for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={dashboard.charts.revenueTrend} loading={loading} />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Order Channels</CardTitle>
              <CardDescription>Distribution by order type</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart data={dashboard.charts.channelComparison} loading={loading} />
            </CardContent>
          </Card>
        </div>

        {/* Hourly Sales */}
        {/* <Card variant="elevated">
          <CardHeader>
            <CardTitle>Hourly Sales</CardTitle>
            <CardDescription>Peak sales timing analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={dashboard.charts.hourlySales} loading={loading} />
          </CardContent>
        </Card> */}
      </div>
    </AdminGuard>
  );
}
