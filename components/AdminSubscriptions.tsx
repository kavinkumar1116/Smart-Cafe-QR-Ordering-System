"use client";

import { useState, useCallback, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import {
  CreditCard,
  Calendar,
  Crown,
  CheckCircle,
  Receipt,
  ArrowUpRight,
  Wallet,
  X,
  Loader2,
} from "lucide-react";
import SubscriptionInvoice from "@/components/Subscriptioninvoice";
import { tenantApiFetch } from "@/lib/tenant";
import { useCafeStore } from "@/src/store/useCafeStore";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface InvoiceData {
  plan_name: string;
  plan_code: string;
  billing_cycle: string;
  next_billing_cycle: string;
  amount: number;
  gst_percentage: number | null;
  start_date: string;
  end_date: string;
  status: number;
  payment_status: string;
  transaction_id: string | null;
  updated_at: string;
}

interface StoreData {
  owner_name: string;
  cafe_name: string;
  branch: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  phone: string;
  tenant_slug: string;
}

interface SubscriptionPlan {
  id: number;
  plan_name: string;
  plan_code: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  max_tables: number;
  max_orders_per_month: number;
  trial_days: number;
  is_active: boolean;
  created_at: string;
}

interface UpgradeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tenant_id: number;
  billing_cycle: "monthly" | "yearly";
}

interface UpgradeModalProps {
  plan: SubscriptionPlan;
  storeData: StoreData | null;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_PLAN_CODE = "PROFESSIONAL";

// ─── Razorpay Script Hook (must be outside component) ────────────────────────

function useRazorpayScript(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById("razorpay-script")) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  return loaded;
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({ plan, storeData, onClose, onSuccess }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayReady = useRazorpayScript();
  const tenantId = useCafeStore((state) => state.tenantId);

  const [form, setForm] = useState<UpgradeFormData>({
    first_name: storeData?.owner_name?.split(" ")[0] ?? "",
    last_name: storeData?.owner_name?.split(" ").slice(1).join(" ") ?? "",
    email: storeData?.email ?? "",
    phone: storeData?.phone ?? "",
    tenant_id: 0,
    billing_cycle: "monthly",
  });

  useEffect(() => {
    if (tenantId) {
      setForm((prev) => ({
        ...prev,
        tenant_id: tenantId,
      }));
    }
  }, [tenantId]);

  const price =
    form.billing_cycle === "yearly" ? plan.yearly_price : plan.monthly_price;

  const yearlySavingsPct =
    plan.yearly_price > 0 && plan.monthly_price > 0
      ? Math.round(
        ((plan.monthly_price * 12 - plan.yearly_price) /
          (plan.monthly_price * 12)) *
        100
      )
      : 0;

  const set =
    (field: keyof UpgradeFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.first_name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!razorpayReady) {
      setError("Payment SDK not loaded yet. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Create Razorpay order ──────────────────────────────
      const orderRes = await tenantApiFetch(
        "/api/admin/subscriptions/upgrade/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            plan_code: plan.plan_code,
            plan_name: plan.plan_name,
            billing_cycle: form.billing_cycle,
            amount: price,
            contact: {
              name: `${form.first_name} ${form.last_name}`.trim(),
              email: form.email,
              phone: form.phone,
            },
          }),
        }
      );

      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message);

      // ── Step 2: Open Razorpay checkout popup ───────────────────────
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount, // already in paise from API
        currency: "INR",
        name: "Smart Cafe",
        description: `${plan.plan_name} — ${form.billing_cycle}`,
        order_id: orderData.order.id,
        prefill: {
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#059669" },

        // ── Step 3: On success → verify on backend ──────────────────
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await tenantApiFetch(
              "/api/admin/subscriptions/upgrade/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_code: plan.plan_code,
                  plan_name: plan.plan_name,
                  billing_cycle: form.billing_cycle,
                  amount: price,
                  contact: {

                    name: `${form.first_name} ${form.last_name}`.trim(),
                    email: form.email,
                    phone: form.phone,
                  },
                  tenant_id: tenantId,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.message);

            onSuccess();
            onClose();
          } catch (err: any) {
            setError(err.message ?? "Payment verified but update failed.");
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", (response: any) => {
        setError(
          response.error.description ?? "Payment failed. Please try again."
        );
        setLoading(false);
      });

      rzp.open();
      // ⚠️ Do NOT setLoading(false) here — wait for handler / ondismiss
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-emerald-600 px-6 py-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Crown size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              Upgrade to {plan.plan_name}
            </h2>
            <p className="mt-0.5 text-sm text-emerald-100">
              Fill in your billing details to proceed
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1 text-emerald-100 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Plan badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Crown size={12} />
            {plan.plan_name}
          </div>

          {/* Billing cycle toggle */}
          <div>
            <label className="mb-2 block text-sm text-slate-500">
              Billing cycle <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, billing_cycle: "monthly" }))}
                className={`flex-1 py-2.5 font-medium transition-colors ${form.billing_cycle === "monthly"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, billing_cycle: "yearly" }))}
                className={`flex-1 py-2.5 font-medium transition-colors ${form.billing_cycle === "yearly"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Yearly
                {yearlySavingsPct > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${form.billing_cycle === "yearly"
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    save {yearlySavingsPct}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={set("first_name")}
                placeholder="First name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">
                Last name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={set("last_name")}
                placeholder="Last name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              readOnly />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Price preview */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-lg font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-slate-500">
                {form.billing_cycle === "yearly"
                  ? "per year · billed annually"
                  : "per month · billed monthly"}
              </p>
            </div>
            {form.billing_cycle === "yearly" && yearlySavingsPct > 0 && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Save {yearlySavingsPct}%
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !razorpayReady}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard size={15} />
                Confirm upgrade
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSubscriptions() {
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoicesData, setInvoicesData] = useState<InvoiceData | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan[]>([]);
  const [upgradePlan, setUpgradePlan] = useState<SubscriptionPlan | null>(null);
  const subscriptionStatus = useCafeStore((state) => state.subscriptionStatus);

  const getInvoice = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/subscriptions", {
      cache: "no-store",
    });
    const data = await response.json();
    setInvoicesData(data.invoicesData[0] ?? null);
    setStoreData(data.getStoreData[0] ?? null);
    setSubscriptionPlan(data.subscriptionsPlanData as SubscriptionPlan[]);
  }, []);

  useEffect(() => {
    getInvoice();
  }, [getInvoice]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const remainingDays = invoicesData?.end_date
    ? Math.max(
      0,
      Math.ceil(
        (new Date(invoicesData.end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      )
    )
    : 0;

  const NextBillingDate = invoicesData?.end_date
    ? new Date(invoicesData.end_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "";

  const startingData = invoicesData?.start_date
    ? new Date(invoicesData.start_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "";

  const renewalDateFormatted = invoicesData?.end_date
    ? new Date(invoicesData.end_date)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .replace(/ /g, "-")
    : "—";

  const invoiveUpdatedDateFormatted = invoicesData?.updated_at
    ? new Date(invoicesData.updated_at)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .replace(/ /g, "-")
    : "—";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminGuard>
      <section className="space-y-6">

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Crown size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Subscription Management
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Billing & Subscription
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your Smart Cafe subscription plan and billing.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Plan</span>
              <Crown className="text-amber-500" size={18} />
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {invoicesData?.plan_name ?? "No Plan"}
            </h3>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Trial Remaining</span>
              <Calendar className="text-blue-500" size={18} />
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {remainingDays} Days
            </h3>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Renewal Date</span>
              <CreditCard className="text-violet-500" size={18} />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              {renewalDateFormatted}
            </h3>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Subscription Status</span>
              <CheckCircle className="text-emerald-500" size={18} />
            </div>
            <h3 className="mt-3 text-lg font-bold">
              <span
                className={`font-semibold ${subscriptionStatus === "Active"
                    ? "text-green-600"
                    : subscriptionStatus === "Expired"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
              >
                {subscriptionStatus}
              </span>
            </h3>
          </div>
        </div>

        {/* Billing Summary + Invoice */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Wallet size={18} />
              <h3 className="font-semibold text-slate-900">Billing Summary</h3>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Plan</span>
                <span className="font-medium">
                  {invoicesData?.plan_name ?? "No Plan"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-medium">
                  ₹{invoicesData?.amount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next Charge</span>
                <span className="font-medium">₹999</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Receipt size={18} />
              <h3 className="font-semibold text-slate-900">Latest Invoice</h3>
            </div>
            <div className="mt-5">
              <p className="font-medium text-slate-900">INV-2026-001</p>
              <p className="mt-1 text-sm text-slate-500">
                Generated on {invoiveUpdatedDateFormatted}
              </p>
              <button
                onClick={() => setShowInvoice(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Upgrade Your Plan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose the perfect plan for your cafe.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {subscriptionPlan.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-6 animate-pulse"
                >
                  <div className="h-5 w-24 rounded bg-slate-200" />
                  <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
                  <div className="mt-5 space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-4 w-full rounded bg-slate-100" />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              subscriptionPlan.map((plan) => {
                const isPopular = plan.plan_code === POPULAR_PLAN_CODE;
                const isCurrentPlan = plan.plan_name === invoicesData?.plan_name;

                const features = [
                  `${plan.max_tables} Tables`,
                  `${plan.max_orders_per_month.toLocaleString()} Orders/month`,
                  plan.description,
                  plan.trial_days > 0
                    ? `${plan.trial_days}-day free trial`
                    : null,
                ].filter(Boolean) as string[];

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-6 ${isPopular
                        ? "border-emerald-500 shadow-lg"
                        : "border-slate-200"
                      }`}
                  >
                    {isPopular && (
                      <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Most Popular
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="absolute left-4 top-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        Current Plan
                      </span>
                    )}

                    <h3
                      className={`text-xl font-bold text-slate-900 ${isCurrentPlan ? "mt-6" : ""
                        }`}
                    >
                      {plan.plan_name}
                    </h3>

                    <p className="mt-2 text-4xl font-bold text-slate-900">
                      ₹{plan.monthly_price.toLocaleString("en-IN")}
                      <span className="text-sm text-slate-500">/month</span>
                    </p>

                    {plan.yearly_price > 0 && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">
                        ₹{plan.yearly_price.toLocaleString("en-IN")}/year — save{" "}
                        {Math.round(
                          ((plan.monthly_price * 12 - plan.yearly_price) /
                            (plan.monthly_price * 12)) *
                          100
                        )}
                        %
                      </p>
                    )}

                    <ul className="mt-5 space-y-3">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle size={16} className="text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={isCurrentPlan}
                      onClick={() => !isCurrentPlan && setUpgradePlan(plan)}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-colors ${isCurrentPlan
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                    >
                      {isCurrentPlan ? "Current Plan" : "Upgrade Plan"}
                      {!isCurrentPlan && <ArrowUpRight size={16} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </section>

      {/* ── Upgrade Modal ── */}
      {upgradePlan && (
        <UpgradeModal
          plan={upgradePlan}
          storeData={storeData}
          onClose={() => setUpgradePlan(null)}
          onSuccess={() => {
            getInvoice();
          }}
        />
      )}

      {/* ── Invoice Modal ── */}
      {showInvoice && invoicesData && storeData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-[2px] print:absolute print:inset-0 print:bg-white print:p-0 animate-in fade-in duration-150">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  body * { visibility: hidden; }
                  #print-invoice-modal, #print-invoice-modal * { visibility: visible; }
                  #print-invoice-modal {
                    position: absolute;
                    left: 0; top: 0;
                    width: 100%;
                    margin: 0; padding: 0;
                  }
                }
              `,
            }}
          />
          <div
            id="print-invoice-modal"
            className="relative w-full print:static"
          >
            <button
              onClick={() => setShowInvoice(false)}
              className="fixed top-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black print:hidden shadow-lg border border-slate-700"
            >
              Close Invoice
            </button>
            <SubscriptionInvoice
              ownerName={storeData.owner_name}
              cafeName={storeData.cafe_name}
              branch={storeData.branch}
              address={storeData.address}
              city={storeData.city}
              state={storeData.state}
              pincode={storeData.pincode}
              email={storeData.email}
              phone={storeData.phone}
              tenantSlug={storeData.tenant_slug}
              planName={invoicesData.plan_name}
              billingCycle={invoicesData.next_billing_cycle}
              amount={invoicesData.amount}
              gstPercentage={invoicesData.gst_percentage}
              startDate={startingData}
              endDate={NextBillingDate}
              paymentStatus={invoicesData.payment_status}
              transactionId={invoicesData.transaction_id}
            />
          </div>
        </div>
      )}
    </AdminGuard>
  );
}