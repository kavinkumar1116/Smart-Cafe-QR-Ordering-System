import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ArrowRight, BadgeCheck, Clock, QrCode, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const stats = [
  { label: "Table QR", value: "Scan" },
  { label: "Order Flow", value: "3 min" },
  { label: "Admin View", value: "Live" },
];

const modules: Array<[LucideIcon, string]> = [
  [BadgeCheck, "Customer menu and cart"],
  [ReceiptText, "Admin order control"],
  [Clock, "QR code generation"],
];

export default function HomePage() {
  return (
    <AppShell title="Smart Cafe" subtitle="Fast QR ordering for modern cafes">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-soft">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80"
            alt="Cafe counter with coffee service"
            className="absolute inset-0 h-full w-full object-cover opacity-72"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/76 to-transparent" />
          <div className="relative flex min-h-[520px] max-w-2xl flex-col justify-center px-6 py-10 sm:px-10">
            <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-crema/82">
              <QrCode size={16} aria-hidden="true" />
              Table-aware ordering
            </p>
            <h2 className="text-4xl font-semibold leading-tight text-crema sm:text-6xl">
              Smart Cafe QR Ordering System
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-crema/74 sm:text-lg">
              Customers scan, browse, add items, and place orders from their table while admins manage live kitchen flow from a focused dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu/1"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-5 py-3 font-semibold text-espresso transition hover:bg-[#f0b556]"
              >
                Start Ordering
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 py-3 font-semibold text-crema transition hover:bg-white/16"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass-panel rounded-lg p-5">
            <h3 className="text-xl font-semibold text-crema">Ordering Flow</h3>
            <div className="mt-5 space-y-4">
              {[
                ["Scan QR", "Each table opens its own menu URL."],
                ["Enter Details", "Name and mobile are captured before cart actions."],
                ["Track Status", "Order status moves from pending to served."],
              ].map(([title, copy], index) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-saffron">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-crema">{title}</p>
                    <p className="text-sm leading-6 text-crema/62">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold text-crema">{stat.value}</p>
                <p className="mt-1 text-xs text-crema/58">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-lg p-5">
            <h3 className="text-xl font-semibold text-crema">Portfolio-Ready Modules</h3>
            <div className="mt-4 grid gap-3">
              {modules.map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-lg bg-white/8 px-3 py-3 text-crema/78">
                  <Icon size={18} className="text-saffron" aria-hidden="true" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
