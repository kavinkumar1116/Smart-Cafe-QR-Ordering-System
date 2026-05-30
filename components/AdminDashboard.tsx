"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
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
} from "lucide-react";
import type { ReactNode } from "react";
import type { ChartDatum, CustomRange } from "@/types/cafe";
import type { LucideIcon } from "lucide-react";

type DateFilter = "Today" | "Yesterday" | "This Week" | "This Month" | "Custom Date Range";
type StatTone = "saffron" | "moss" | "berry" | "blue";

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
      { label: "Dine-in", value: 0, color: "#e2a13a" },
      { label: "Takeaway", value: 0, color: "#6f8f57" },
      { label: "Delivery", value: 0, color: "#a53f5b" },
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
  helper: string;
  icon: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
}

const StatCard = memo(function StatCard({ title, value, helper, icon: Icon, tone = "saffron", loading }: StatCardProps) {
  const toneClasses: Record<StatTone, string> = {
    saffron: "bg-saffron text-espresso",
    moss: "bg-moss text-white",
    berry: "bg-berry text-white",
    blue: "bg-[#6c8cff] text-white",
  };

  return (
    <article className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft transition hover:-translate-y-0.5 hover:bg-white/12">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-crema/60">{title}</p>
          <p className="mt-2 min-h-8 text-2xl font-semibold text-crema">
            {loading ? <span className="block h-7 w-24 animate-pulse rounded bg-white/12" /> : value}
          </p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={21} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs text-crema/48">{helper}</p>
    </article>
  );
});

interface ChartProps<T extends ChartDatum = ChartDatum> {
  data: T[];
  loading?: boolean;
}

function EmptyChartState({ loading }: { loading?: boolean }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg bg-black/16 text-sm text-crema/48">
      {loading ? "Loading analytics..." : "No data for this range"}
    </div>
  );
}

const BarChart = memo(function BarChart({ data, loading }: ChartProps) {
  const max = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);
  if (!max) return <EmptyChartState loading={loading} />;

  return (
    <div className="flex h-64 items-end gap-2 sm:gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-52 w-full items-end rounded-lg bg-black/16 p-1">
            <div
              className="w-full rounded-lg bg-gradient-to-t from-saffron to-[#ffd27f] transition-[height] duration-500"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              title={`${item.label}: ${formatCurrency(item.value)}`}
            />
          </div>
          <span className="max-w-full truncate text-[11px] text-crema/55 sm:text-xs">{item.label}</span>
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
    <div className="overflow-hidden rounded-lg bg-black/16 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
        <defs>
          <linearGradient id="revenueLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#e2a13a" />
            <stop offset="100%" stopColor="#6f8f57" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#revenueLine)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#fff8f0" />
            <circle cx={point.x} cy={point.y} r="9" fill="#e2a13a" opacity="0.22" />
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-2 text-xs text-crema/48 sm:grid-cols-7">
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

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-44 w-44 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        {segments.map((item) => (
          <circle
            key={item.label}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={item.color}
            strokeWidth="6"
            strokeDasharray={`${item.dash} ${100 - item.dash}`}
            strokeDashoffset={item.offset}
            className="transition-all duration-500"
          />
        ))}
      </svg>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/8 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm text-crema/72">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold text-crema">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

interface PanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const Panel = memo(function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-crema">{title}</h3>
        <p className="mt-1 text-sm text-crema/52">{subtitle}</p>
      </div>
      {children}
    </section>
  );
});

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [customRange, setCustomRange] = useState<CustomRange>(() => getInitialCustomRange());
  const [dashboard, setDashboard] = useState<DashboardPayload>(defaultDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

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
        const response = await fetch(`/api/admin/dashboard?${queryString}`, {
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
        <section className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDateFilter(filter)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    dateFilter === filter
                      ? "bg-saffron text-espresso"
                      : "border border-white/10 bg-white/8 text-crema/70 hover:bg-white/14"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {dateFilter === "Custom Date Range" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-crema/45">
                  From Date
                  <input
                    type="date"
                    value={customRange.from}
                    max={customRange.to}
                    onChange={(event) => setCustomRange((range) => ({ ...range, from: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-espresso px-3 py-2 text-sm font-semibold text-crema outline-none focus:border-saffron"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-crema/45">
                  To Date
                  <input
                    type="date"
                    value={customRange.to}
                    min={customRange.from}
                    onChange={(event) => setCustomRange((range) => ({ ...range, to: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-espresso px-3 py-2 text-sm font-semibold text-crema outline-none focus:border-saffron"
                  />
                </label>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mt-3 rounded-lg border border-berry/30 bg-berry/10 px-3 py-2 text-sm text-crema/80">{error}</p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Orders" value={metrics.totalOrders} helper="Orders in selected range" icon={ShoppingBag} loading={loading} />
          <StatCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} helper="Gross sales in selected range" icon={CreditCard} tone="moss" loading={loading} />
          <StatCard title="Inside Orders" value={metrics.insideOrders} helper="Dine-in order type only" icon={Utensils} tone="blue" loading={loading} />
          <StatCard title="Outside Orders" value={metrics.outsideOrders} helper="Takeaway order type only" icon={Truck} tone="berry" loading={loading} />
          <StatCard title="Pending Orders" value={metrics.pendingOrders} helper="Orders still pending" icon={Clock3} loading={loading} />
          <StatCard title="Completed Orders" value={metrics.completedOrders} helper="Served or completed orders" icon={CheckCircle2} tone="moss" loading={loading} />
          <StatCard title="Customer Count" value={metrics.customerCount} helper="Unique customer contacts" icon={UsersRound} tone="blue" loading={loading} />
          <StatCard title="Peak Sales Time" value={metrics.peakSalesTime} helper={formatCurrency(metrics.peakSalesAmount)} icon={TrendingUp} tone="berry" loading={loading} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Revenue Trend" subtitle="Daily totals for the latest seven-day sales window">
            <LineChart data={dashboard.charts.revenueTrend} loading={loading} />
          </Panel>

          <Panel title="Order Channel Comparison" subtitle="Dine-in, takeaway, and delivery orders">
            <DonutChart data={dashboard.charts.channelComparison} loading={loading} />
          </Panel>
        </section>

        <section>
          <Panel title="Peak Sales Timing" subtitle="Sales amount grouped by hour from opening to closing">
            <BarChart data={dashboard.charts.hourlySales} loading={loading} />
          </Panel>
        </section>
      </div>
    </AdminGuard>
  );
}
