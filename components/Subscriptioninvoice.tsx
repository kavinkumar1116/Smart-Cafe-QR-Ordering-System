"use client";

import React, { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubscriptionInvoiceProps {
  // Tenant / owner info
  ownerName: string;
  cafeName: string;
  branch?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email: string;
  phone: string;
  tenantSlug: string;

  // Subscription details
  invoiceNumber?: string;
  planName: string;
  billingCycle: string;
  amount: number;
  gstPercentage?: number | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  paymentStatus?: string;
  transactionId?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcDaysRemaining(endDateStr: string): number {
  const end = new Date(endDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${rand}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionInvoice({
  ownerName,
  cafeName,
  branch,
  address,
  city,
  state,
  pincode,
  email,
  phone,
  tenantSlug,
  invoiceNumber,
  planName,
  billingCycle,
  amount,
  gstPercentage = 0,
  startDate,
  endDate,
  paymentStatus = "Paid",
  transactionId,
}: SubscriptionInvoiceProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [invNo] = useState(invoiceNumber ?? generateInvoiceNumber());
  const issuedDate = formatDate(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setDaysRemaining(calcDaysRemaining(endDate));
  }, [endDate]);

  const gstRate = gstPercentage ?? 0;
  const gstAmount = (amount * gstRate) / 100;
  const totalAmount = amount + gstAmount;

  const isPaid = paymentStatus? paymentStatus:false;
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 3;

  const daysLabel = isExpired
    ? "Expired"
    : daysRemaining === 0
    ? "Expires today"
    : `${daysRemaining} days`;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">

        {/* Print / Download button — hidden when printing */}
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 print:shadow-none print:border-0 print:rounded-none">

          {/* ── Header ── */}
          <div className="bg-gray-900 px-8 py-7 flex items-start justify-between">
            <div>
              <h1 className="text-amber-400 text-2xl font-medium tracking-wide">
                ☕ Smart Cafe
              </h1>
              <p className="text-gray-400 text-xs mt-1">QR Ordering & Billing Platform</p>
              <span className="inline-flex items-center gap-1.5 mt-3 bg-emerald-900/60 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Active subscription
              </span>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-medium text-sm">{invNo}</p>
              <p className="text-gray-400 text-xs mt-1">Issued: {issuedDate}</p>
              <p className="text-gray-400 text-xs mt-0.5">Due: {issuedDate}</p>
            </div>
          </div>

          <div className="px-8 py-7">

            {/* ── Billed to / From ── */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-2">Billed to</p>
                <p className="font-medium text-gray-900">{ownerName}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {cafeName}{branch ? ` — ${branch}` : ""}
                </p>
                {address && (
                  <p className="text-sm text-gray-500">
                    {address}, {city} {pincode}
                  </p>
                )}
                {state && <p className="text-sm text-gray-500">{state}</p>}
                <p className="text-sm text-gray-500 mt-1">{email}</p>
                <p className="text-sm text-gray-500">{phone}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-2">From</p>
                <p className="font-medium text-gray-900">Smart Cafe Pvt. Ltd.</p>
                <p className="text-sm text-gray-500 mt-0.5">support@smartcafe.in</p>
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">Tenant ID</p>
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                    {tenantSlug}
                  </code>
                </div>
                <div className="mt-3">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200">
                      ✓ Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200">
                      ⏳ {paymentStatus}
                    </span>
                  )}
                </div>
                {transactionId && (
                  <p className="text-xs text-gray-400 mt-2">
                    Txn: <span className="font-mono text-gray-600">{transactionId}</span>
                  </p>
                )}
              </div>
            </div>

            <hr className="border-gray-100 mb-6" />

            {/* ── Plan card ── */}
            <div className="bg-gray-50 rounded-xl px-5 py-4 flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-amber-400 text-lg">
                  🚀
                </div>
                <div>
                  <p className="font-medium text-gray-900">{planName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">🔄 {endDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-medium text-gray-900">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-gray-400">/ {startDate}</p>
              </div>
            </div>

            <hr className="border-gray-100 mb-5" />

            {/* ── Date cards ── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[11px] text-gray-400 mb-1.5">📅 Start date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(startDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[11px] text-gray-400 mb-1.5">📅 End date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(endDate)}</p>
              </div>
              <div className={`rounded-xl px-4 py-3 ${isExpired ? "bg-red-50" : isExpiringSoon ? "bg-amber-50" : "bg-gray-50"}`}>
                <p className="text-[11px] text-gray-400 mb-1.5">⏱ Days remaining</p>
                <p className={`text-sm font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
                  {daysLabel}
                </p>
              </div>
            </div>

            <hr className="border-gray-100 mb-5" />

            {/* ── Billing table ── */}
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] text-gray-400 uppercase tracking-wider pb-2 font-medium">Description</th>
                  <th className="text-left text-[11px] text-gray-400 uppercase tracking-wider pb-2 font-medium">Plan</th>
                  <th className="text-right text-[11px] text-gray-400 uppercase tracking-wider pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-3 text-gray-700">Smart Cafe subscription</td>
                  <td className="py-3 text-gray-500">{planName} ({billingCycle})</td>
                  <td className="py-3 text-right text-gray-700">{formatCurrency(amount)}</td>
                </tr>
                {gstRate > 0 && (
                  <tr>
                    <td className="py-3 text-gray-400 text-xs" colSpan={2}>GST ({gstRate}%)</td>
                    <td className="py-3 text-right text-gray-400 text-xs">{formatCurrency(gstAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── Totals ── */}
            <div className="flex flex-col items-end gap-1.5 mb-6">
              <div className="flex gap-12 text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="min-w-[90px] text-right text-gray-700">{formatCurrency(amount)}</span>
              </div>
              <div className="flex gap-12 text-sm text-gray-500">
                <span>GST ({gstRate}%)</span>
                <span className="min-w-[90px] text-right text-gray-700">{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex gap-12 text-sm text-gray-500">
                <span>Discount</span>
                <span className="min-w-[90px] text-right text-gray-700">— {formatCurrency(0)}</span>
              </div>
              <div className="flex gap-12 text-base font-medium text-gray-900 pt-2 border-t border-gray-200 mt-1">
                <span>Total</span>
                <span className="min-w-[90px] text-right">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Smart Cafe Pvt. Ltd. &nbsp;·&nbsp; Thank you for choosing us!
            </p>
            <button
              onClick={() => window.print()}
              className="print:hidden flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ↓ Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}