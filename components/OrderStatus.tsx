"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Home, ReceiptText } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { calcGrandTotal, calcTax, estimatePrepTimeMinutes } from "@/lib/order-math";
import type { CafeOrder, OrderResponse, OrderStatus as CafeOrderStatus } from "@/types/cafe";

const steps: CafeOrderStatus[] = ["Pending", "Preparing", "Ready", "Served"];

interface OrderStatusProps {
  id: string;
}

export default function OrderStatus({ id }: OrderStatusProps) {
  const [order, setOrder] = useState<CafeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      const response = await fetch(`/api/orders?id=${id}`, { cache: "no-store" });
      const data = (await response.json()) as OrderResponse;
      if (!response.ok) {
        setError(data.error || "Order not found");
      } else {
        setOrder(data.order || null);
      }
      setLoading(false);
    }

    loadOrder();
    const interval = setInterval(loadOrder, 7000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return <div className="glass-panel rounded-lg p-8 text-center text-crema/70">Loading order...</div>;
  }

  if (error) {
    return (
      <div className="glass-panel rounded-lg p-8 text-center">
        <p className="font-semibold text-crema">{error}</p>
        <Link href="/" className="mt-4 inline-flex rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso">
          Back Home
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="glass-panel rounded-lg p-8 text-center text-crema/70">Order not found.</div>;
  }

  const stepIndex = Math.max(0, steps.indexOf(order.status));
  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0),
    0
  );
  const tax = calcTax(subtotal);
  const total = order.total_amount ? Number(order.total_amount) : calcGrandTotal(subtotal, tax);
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const prepMinutes = estimatePrepTimeMinutes(itemCount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="glass-panel rounded-lg p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-moss text-white">
            <CheckCircle2 size={25} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-saffron">Order placed</p>
            <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">{order.order_id}</h2>
            <p className="mt-2 text-sm leading-6 text-crema/62">
              Table {order.table_id} for {order.customer_name}. Updates refresh automatically.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-lg border p-4 ${
                index <= stepIndex
                  ? "border-saffron bg-saffron/18 text-crema"
                  : "border-white/10 bg-white/8 text-crema/55"
              }`}
            >
              <Clock3 size={18} className={index <= stepIndex ? "text-saffron" : "text-crema/42"} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-crema">Bill Details</h3>
          <div className="mt-4 space-y-3">
            {(order.items || []).map((item) => (
              <div key={item.id || item.menu_item_id} className="flex items-center justify-between gap-4 rounded-lg bg-white/8 p-3">
                <div>
                  <p className="font-medium text-crema">{item.name}</p>
                  <p className="text-sm text-crema/58">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-crema">
                  {formatCurrency(Number(item.price_at_time) * Number(item.quantity))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="glass-panel h-fit rounded-lg p-5">
        <ReceiptText className="text-saffron" size={30} aria-hidden="true" />
        <h3 className="mt-4 text-xl font-semibold text-crema">Receipt</h3>
        <div className="mt-4 space-y-3 text-sm text-crema/68">
          <div className="flex justify-between gap-4">
            <span>Mobile</span>
            <span className="text-crema">{order.customer_mobile}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Status</span>
            <span className="text-crema">{order.status}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Payment</span>
            <span className="text-crema">{order.payment_status}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span className="text-crema">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>GST / Tax</span>
            <span className="text-crema">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Est. prep time</span>
            <span className="text-crema">{prepMinutes} min</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-3 text-lg font-semibold text-crema">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <Link
          href="/"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-3 font-semibold text-crema"
        >
          <Home size={18} aria-hidden="true" />
          Home
        </Link>
      </aside>
    </div>
  );
}
