"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
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
import type {
  CafeOrder,
  ChartDatum,
  CustomRange,
  DashboardOrder,
  DateRange,
  DayBucket,
  OrderMode,
  PaymentStatus,
  OrderStatus,
  OrdersResponse,
} from "@/types/cafe";
import type { LucideIcon } from "lucide-react";

type DateFilter = "Today" | "Yesterday" | "This Week" | "This Month" | "Custom Date Range";
type StatTone = "saffron" | "moss" | "berry" | "blue";

const filterOptions: DateFilter[] = ["Today", "Yesterday", "This Week", "This Month", "Custom Date Range"];
const branches = ["All Branches", "Central Cafe", "Airport Kiosk", "Lakeview Bistro"];
const statuses: OrderStatus[] = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];

const statusColors: Record<OrderStatus, string> = {
  Pending: "#e2a13a",
  Preparing: "#7ba8ff",
  Ready: "#6f8f57",
  Served: "#36c58a",
  Cancelled: "#a53f5b",
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getDateRange(filter: DateFilter, customRange: CustomRange): DateRange {
  const now = new Date();
  const todayStart = startOfDay(now);

  if (filter === "Yesterday") {
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
  }

  if (filter === "This Week") {
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return { start: weekStart, end: endOfDay(now) };
  }

  if (filter === "This Month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: endOfDay(now),
    };
  }

  if (filter === "Custom Date Range" && customRange.from && customRange.to) {
    return {
      start: startOfDay(new Date(customRange.from)),
      end: endOfDay(new Date(customRange.to)),
    };
  }

  return { start: todayStart, end: endOfDay(now) };
}

function buildDemoOrders(): DashboardOrder[] {
  const now = new Date();
  const records = [];

  for (let index = 0; index < 72; index += 1) {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - (index % 24));
    createdAt.setHours(8 + (index % 14), (index * 11) % 60, 0, 0);

    const mode: OrderMode = index % 3 === 0 ? "Dine-In" : index % 3 === 1 ? "Takeaway" : "Delivery";
    const status = statuses[index % statuses.length];
    const paymentStatus: PaymentStatus = status === "Cancelled" ? "Pending" : index % 4 === 0 ? "Pending" : "Paid";
    const total = 240 + ((index * 73) % 960);

    records.push({
      id: `demo-${index}`,
      order_id: `SC-D${1000 + index}`,
      table_id: (index % 12) + 1,
      customer_name: `Guest ${index + 1}`,
      branch: branches[1 + (index % 3)],
      mode,
      status,
      payment_status: paymentStatus,
      total_amount: total,
      customer_mobile: `90000${String(index).padStart(5, "0")}`,
      created_at: createdAt.toISOString(),
    });
  }

  return records;
}

function normalizeLiveOrders(orders: CafeOrder[]): DashboardOrder[] {
  return orders.map((order, index) => ({
    ...order,
    branch: order.branch || branches[1 + (index % 3)],
    mode: order.mode || (Number(order.table_id) > 0 ? "Dine-In" : "Takeaway"),
    total_amount: Number(order.total_amount || 0),
  }));
}

function getGrowth(currentRevenue: number, previousRevenue: number): number {
  if (!previousRevenue) return currentRevenue ? 100 : 0;
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  helper: string;
  icon: LucideIcon;
  tone?: StatTone;
}

function StatCard({ title, value, helper, icon: Icon, tone = "saffron" }: StatCardProps) {
  const toneClasses: Record<StatTone, string> = {
    saffron: "bg-saffron text-espresso",
    moss: "bg-moss text-white",
    berry: "bg-berry text-white",
    blue: "bg-[#6c8cff] text-white",
  };

  return (
    <article className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft transition hover:-translate-y-0.5 hover:bg-white/12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-crema/60">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-crema">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={21} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs text-crema/48">{helper}</p>
    </article>
  );
}

interface ChartProps<T extends ChartDatum = ChartDatum> {
  data: T[];
}

function BarChart({ data }: ChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-64 items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-52 w-full items-end rounded-lg bg-black/16 p-1">
            <div
              className="w-full rounded-lg bg-gradient-to-t from-saffron to-[#ffd27f] transition-all duration-500"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="max-w-full truncate text-xs text-crema/55">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: ChartProps<DayBucket>) {
  const width = 640;
  const height = 220;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = height - (item.value / max) * (height - 20) - 10;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

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
}

function PieChart({ data }: ChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const segments = data.reduce(
    (result: { offset: number; items: Array<ChartDatum & { dash: number; offset: number }> }, item) => {
      const dash = (item.value / total) * 100;
      return {
        offset: result.offset - dash,
        items: [...result.items, { ...item, dash, offset: result.offset }],
      };
    },
    { offset: 25, items: [] }
  ).items;

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
            <span className="flex items-center gap-2 text-sm text-crema/72">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold text-crema">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-crema">{title}</h3>
        <p className="mt-1 text-sm text-crema/52">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [customRange] = useState<CustomRange>({ from: "", to: "" });
  const [search] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        const data = (await response.json()) as OrdersResponse;
        setOrders([...normalizeLiveOrders(data.orders || []), ...buildDemoOrders()]);
      } catch {
        setOrders(buildDemoOrders());
      }
    }

    loadOrders();
    const interval = setInterval(loadOrders, 12000);
    return () => clearInterval(interval);
  }, []);

  const dashboardData = useMemo(() => {
    const range = getDateRange(dateFilter, customRange);
    const previousStart = new Date(range.start);
    const previousEnd = new Date(range.start);
    const span = Math.max(1, range.end.getTime() - range.start.getTime());
    previousStart.setTime(range.start.getTime() - span);
    previousEnd.setTime(range.start.getTime() - 1);

    const filtered = orders.filter((order) => {
      const createdAt = new Date(order.created_at);
      const inRange = createdAt >= range.start && createdAt <= range.end;
      const inBranch = branchFilter === "All Branches" || order.branch === branchFilter;
      const inSearch =
        !search.trim() ||
        String(order.order_id || "").toLowerCase().includes(search.toLowerCase()) ||
        String(order.customer_mobile || "").includes(search);
      return inRange && inBranch && inSearch;
    });

    const previous = orders.filter((order) => {
      const createdAt = new Date(order.created_at);
      const inRange = createdAt >= previousStart && createdAt <= previousEnd;
      const inBranch = branchFilter === "All Branches" || order.branch === branchFilter;
      return inRange && inBranch;
    });

    const totalRevenue = filtered.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const previousRevenue = previous.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const insideOrders = filtered.filter((order) => order.mode === "Dine-In").length;
    const outsideOrders = filtered.filter((order) => order.mode !== "Dine-In").length;
    const pendingOrders = filtered.filter((order) => ["Pending", "Preparing", "Ready"].includes(order.status)).length;
    const completedOrders = filtered.filter((order) => order.status === "Served").length;
    const customers = new Set(filtered.map((order) => order.customer_mobile || order.customer_name || order.id)).size;

    const hourBuckets = Array.from({ length: 14 }, (_, index) => {
      const hour = index + 8;
      return { label: `${hour}:00`, value: 0 };
    });
    filtered.forEach((order) => {
      const hour = new Date(order.created_at).getHours();
      if (hour >= 8 && hour <= 21) {
        hourBuckets[hour - 8].value += Number(order.total_amount);
      }
    });

    const dayBuckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(range.end);
      date.setDate(range.end.getDate() - (6 - index));
      return {
        date,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        value: 0,
      };
    });
    filtered.forEach((order) => {
      const createdAt = startOfDay(new Date(order.created_at)).getTime();
      const bucket = dayBuckets.find((item) => startOfDay(item.date).getTime() === createdAt);
      if (bucket) bucket.value += Number(order.total_amount);
    });

    const statusData = statuses.map((status) => ({
      label: status,
      value: filtered.filter((order) => order.status === status).length,
      color: statusColors[status],
    }));

    const modeData = [
      { label: "Dine-In", value: insideOrders, color: "#e2a13a" },
      { label: "Takeaway", value: filtered.filter((order) => order.mode === "Takeaway").length, color: "#6f8f57" },
      { label: "Delivery", value: filtered.filter((order) => order.mode === "Delivery").length, color: "#a53f5b" },
    ];

    const peak = hourBuckets.reduce((best, item) => (item.value > best.value ? item : best), hourBuckets[0]);

    return {
      filtered,
      totalRevenue,
      revenueGrowth: getGrowth(totalRevenue, previousRevenue),
      insideOrders,
      outsideOrders,
      pendingOrders,
      completedOrders,
      customers,
      hourBuckets,
      dayBuckets,
      statusData,
      modeData,
      peak,
    };
  }, [branchFilter, customRange, dateFilter, orders, search]);

  const growthPositive = dashboardData.revenueGrowth >= 0;

  return (
    <AdminGuard>
      <div className="space-y-6">

        <section className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft">
          <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr_1.2fr]">
             
              {filterOptions.map((filter) => (
                <button
                  key={filter}
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
           

            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="rounded-lg border border-white/10 bg-espresso px-3 py-3 text-sm font-semibold text-crema outline-none focus:border-saffron"
            >
              {branches.map((branch) => (
                <option key={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Orders" value={dashboardData.filtered.length} helper="Orders in selected range" icon={ShoppingBag} />
          <StatCard title="Total Revenue" value={formatCurrency(dashboardData.totalRevenue)} helper={`${growthPositive ? "+" : ""}${dashboardData.revenueGrowth.toFixed(1)}% vs previous period`} icon={CreditCard} tone="moss" />
          <StatCard title="Inside Orders" value={dashboardData.insideOrders} helper="Dine-in table orders" icon={Utensils} tone="blue" />
          <StatCard title="Outside Orders" value={dashboardData.outsideOrders} helper="Takeaway and delivery" icon={Truck} tone="berry" />
          <StatCard title="Pending Orders" value={dashboardData.pendingOrders} helper="Pending, preparing, or ready" icon={Clock3} />
          <StatCard title="Completed Orders" value={dashboardData.completedOrders} helper="Served orders" icon={CheckCircle2} tone="moss" />
          <StatCard title="Customer Count" value={dashboardData.customers} helper="Unique customer contacts" icon={UsersRound} tone="blue" />
          <StatCard title="Peak Sales Time" value={dashboardData.peak.label} helper={formatCurrency(dashboardData.peak.value)} icon={TrendingUp} tone="berry" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Revenue Trend" subtitle="Seven-day revenue movement for the selected filter">
            <LineChart data={dashboardData.dayBuckets} />
          </Panel>

          <Panel title="Order Status Ratio" subtitle="Current order mix by workflow status">
            <PieChart data={dashboardData.statusData} />
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Peak Sales Timing" subtitle="Hourly sales value from opening to close">
            <BarChart data={dashboardData.hourBuckets} />
          </Panel>

          <Panel title="Dine-In vs Takeaway" subtitle="Channel comparison across dine-in, takeaway, and delivery">
            <PieChart data={dashboardData.modeData} />
          </Panel>
        </section>
      </div>
    </AdminGuard>
  );
}
