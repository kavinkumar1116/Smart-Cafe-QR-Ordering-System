"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Minus, Plus, ReceiptText, Send, Trash2 } from "lucide-react";
import { tenantApiFetch } from "@/lib/tenant";
import { formatCurrency } from "@/lib/format";
import { calcGrandTotal, calcSubtotal, calcTax, estimatePrepTimeMinutes } from "@/lib/order-math";
import type { CartItem, CustomerDetails, OrderResponse } from "@/types/cafe";

export default function CartExperience() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>({
    customer_name: "",
    customer_mobile: "",
    table_id: 1,
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => calcSubtotal(cart), [cart]);
  const tax = useMemo(() => calcTax(subtotal), [subtotal]);
  const total = useMemo(() => calcGrandTotal(subtotal, tax), [subtotal, tax]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const prepMinutes = estimatePrepTimeMinutes(itemCount);

  function changeQuantity(id: number, delta: number): void {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  async function placeOrder(): Promise<void> {
    setError("");

    if (!customer.customer_name?.trim() || !customer.customer_mobile?.trim()) {
      setError("Customer name and mobile number are required.");
      return;
    }

    if (cart.length === 0) {
      setError("Add at least one item before placing the order.");
      return;
    }

    setPlacing(true);
    const response = await tenantApiFetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_id: Number(customer.table_id || cart[0]?.table_id || 1),
        customer_name: customer.customer_name,
        customer_mobile: customer.customer_mobile,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const data = (await response.json()) as OrderResponse;
    setPlacing(false);

    if (!response.ok) {
      setError(data.error || data.detail || "Unable to place order.");
      return;
    }

    setCart([]);
    if (!data.order) {
      setError("Unable to place order.");
      return;
    }

    router.push(`/order/${data.order.id || data.order.order_id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="glass-panel rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-saffron">Checkout</p>
            <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Review Cart</h2>
          </div>
          <Link
            href={`/menu/${customer.table_id || 1}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 py-3 font-semibold text-crema"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Menu
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {cart.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center">
              <ReceiptText className="mx-auto text-saffron" size={34} aria-hidden="true" />
              <p className="mt-3 font-medium text-crema">Your cart is empty.</p>
              <p className="mt-1 text-sm text-crema/58">Start from a table menu to add cafe items.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/8 p-3 sm:flex-row sm:items-center">
                <img src={item.image_url} alt={item.name} className="h-24 w-full rounded-lg object-cover sm:w-28" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-crema">{item.name}</p>
                  <p className="mt-1 text-sm text-crema/58">{item.category}</p>
                  <p className="mt-2 font-medium text-saffron">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 p-1">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema"
                      onClick={() => changeQuantity(item.id, -1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-7 text-center font-semibold text-crema">{item.quantity}</span>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema"
                      onClick={() => changeQuantity(item.id, 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema/70"
                    onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}
                    aria-label="Remove item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="glass-panel h-fit rounded-lg p-5">
        <h3 className="text-xl font-semibold text-crema">Customer Details</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">Name</span>
            <input
              value={customer.customer_name || ""}
              onChange={(event) => setCustomer((current) => ({ ...current, customer_name: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">WhatsApp Mobile Number</span>
            <input
              value={customer.customer_mobile || ""}
              onChange={(event) => setCustomer((current) => ({ ...current, customer_mobile: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
              inputMode="tel"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">Table</span>
            <input
              value={customer.table_id || 1}
              onChange={(event) => setCustomer((current) => ({ ...current, table_id: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
              inputMode="numeric"
              disabled={cart.length > 0}
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg bg-white/8 p-4">
          <div className="flex items-center justify-between text-crema/70">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-crema/68">
            <span>Subtotal</span>
            <span className="font-semibold text-crema">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-crema/68">
            <span>GST / Tax</span>
            <span className="font-semibold text-crema">{formatCurrency(tax)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-semibold text-crema">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-crema/60">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} className="text-saffron" aria-hidden="true" />
              Est. prep time
            </span>
            <span className="font-semibold text-crema">{prepMinutes} min</span>
          </div>
        </div>

        {error ? <p className="mt-3 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p> : null}

        <button
          onClick={placeOrder}
          disabled={placing}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso transition hover:bg-[#efb150] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} aria-hidden="true" />
          {placing ? "Placing..." : "Place Order"}
        </button>
      </aside>
    </div>
  );
}
