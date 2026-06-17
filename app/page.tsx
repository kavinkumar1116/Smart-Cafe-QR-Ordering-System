"use client";

import { useState, ReactNode } from "react";
import {
  QrCode, BadgeCheck, Coffee, ShoppingCart, ChefHat,
  BarChart2, Bell, Clock, User, Lock,
  ArrowRight, Rocket, Check, Mail, ShieldCheck, X,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

interface FInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  formData: Record<string, string>;
  onValueChange: (id: string, value: string) => void;
  errors: Record<string, string | null>;
}

interface FSelectProps {
  id: string;
  formData: Record<string, string>;
  onValueChange: (id: string, value: string) => void;
  errors: Record<string, string | null>;
  children: ReactNode;
}

interface StepProps {
  formData: Record<string, string>;
  onValueChange: (id: string, value: string) => void;
  errors: Record<string, string | null>;
}


interface StepDotsProps {
  current: number;
  total: number;
}

interface TrialSignupModalProps {
  onClose: () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  { title: "Scan QR", desc: "Each table opens its own menu URL instantly" },
  { title: "Enter details & order", desc: "Name and mobile captured before cart actions" },
  { title: "Track live status", desc: "Pending → preparing → served in real time" },
];

interface ModuleItem {
  Icon: LucideIcon;
  label: string;
}

const modules: ModuleItem[] = [
  { Icon: QrCode, label: "QR Gen" },
  { Icon: ShoppingCart, label: "Live cart" },
  { Icon: ChefHat, label: "Kitchen" },
  { Icon: BarChart2, label: "Analytics" },
  { Icon: Bell, label: "Notify" },
  { Icon: Clock, label: "Status" },
  { Icon: User, label: "Admin" },
  { Icon: Lock, label: "Auth" },
];

// ─── Modal constants ───────────────────────────────────────────────────────────

const OUTLET_TYPES = [
  "Cafe / Coffee shop",
  "Quick service restaurant (QSR)",
  "Fine dining",
  "Bakery & patisserie",
  "Food court stall",
  "Cloud kitchen",
  "Bar & lounge",
];

const TABLE_RANGES = [
  "1 – 5 tables",
  "6 – 15 tables",
  "16 – 30 tables",
  "31 – 60 tables",
  "60+ tables",
];

const STATES = [
  "Andhra Pradesh", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu",
  "Telangana", "Delhi", "Gujarat", "Rajasthan", "West Bengal",
  "Uttar Pradesh", "Other",
];

const DESIGNATIONS = ["Owner", "Manager", "IT / Tech admin", "Operations head"];

const STEP_REQUIRED: string[][] = [
  ["cafeName", "branch", "outletType", "tables"],
  ["address", "city", "pincode", "state", "phone"],
  ["ownerName", "email", "password", "confirmPassword"],
];

const STEP_LABELS = [
  "Step 1 of 3 — Cafe identity",
  "Step 2 of 3 — Location & contact",
  "Step 3 of 3 — Owner / admin account",
];

const EMPTY_FORM: Record<string, string> = {
  cafeName: "", brand: "", branch: "", outletType: "", tables: "",
  address: "", city: "", pincode: "", state: "", phone: "", whatsapp: "",
  ownerName: "", designation: "", email: "", password: "", confirmPassword: "", gst: "", fssai: "",
};

const validators: Record<
  string,
  (v: string, form: Record<string, string>) => string | null
> = {
  cafeName: (v) => v.trim() ? null : "Please enter your cafe name",
  branch: (v) => v.trim() ? null : "Please enter branch name",
  outletType: (v) => v ? null : "Please select outlet type",
  tables: (v) => v ? null : "Please select table count",
  address: (v) => v.trim() ? null : "Please enter your address",
  city: (v) => v.trim() ? null : "Required",
  pincode: (v) => /^\d{6}$/.test(v.trim()) ? null : "Enter valid 6-digit pincode",
  state: (v) => v ? null : "Please select state",
  phone: (v) =>
    /^(\+91)?[6-9]\d{9}$/.test(v.replace(/\s/g, ""))
      ? null
      : "Enter valid 10-digit number",
  ownerName: (v) => v.trim() ? null : "Required",
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? null
      : "Enter a valid email address",

  password: (v) =>
    v.length >= 6
      ? null
      : "Password must be at least 6 characters",

  confirmPassword: (v, form) =>
    v === form.password
      ? null
      : "Passwords do not match",
};

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required = false, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[11px] text-[#fdf6ec]/50">
        {label}
        {required && <span className="ml-[2px] text-[#e8a030]">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      {!error && hint && <p className="text-[10px] text-[#fdf6ec]/30">{hint}</p>}
    </div>
  );
}

const inputCls = (hasErr: boolean) =>
  [
    "w-full rounded-[8px] border px-3 py-[9px] text-[13px] text-[#fdf6ec]",
    "bg-white/5 placeholder:text-[#fdf6ec]/25 outline-none transition-colors",
    hasErr
      ? "border-red-500/60"
      : "border-white/12 focus:border-[#e8a030]/50 focus:bg-[#e8a030]/4",
  ].join(" ");

function FInput({
  id,
  formData,
  onValueChange,
  errors,
  ...rest
}: FInputProps) {
  return (
    <input
      id={id}
      value={formData[id] ?? ""}
      onChange={(e) => onValueChange(id, e.target.value)}
      className={inputCls(!!errors[id])}
      {...rest}
    />
  );
}

function FSelect({
  id,
  formData,
  onValueChange,
  errors,
  children,
}: FSelectProps) {
  return (
    <select
      id={id}
      value={formData[id] ?? ""}
      onChange={(e) => onValueChange(id, e.target.value)}
      className={[
        inputCls(!!errors[id]),
        "cursor-pointer appearance-none text-[#fdf6ec]/60",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

// ─── Step 1: Cafe identity ─────────────────────────────────────────────────────

function StepCafeIdentity({ formData, onValueChange, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Cafe / restaurant name" required error={errors.cafeName}>
        <FInput id="cafeName" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="e.g. Brew & Bloom Cafe" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand / chain name" hint="Leave blank if independent">
          <FInput id="brand" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="e.g. Brewmasters" />
        </Field>
        <Field label="Branch name" required error={errors.branch}>
          <FInput id="branch" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="e.g. Koramangala Branch" />
        </Field>
      </div>

      <Field label="Type of outlet" required error={errors.outletType}>
        <FSelect id="outletType" formData={formData} onValueChange={onValueChange} errors={errors}>
          <option value="">Select outlet type</option>
          {OUTLET_TYPES.map((t) => <option key={t}>{t}</option>)}
        </FSelect>
      </Field>

      <Field label="Number of tables" required error={errors.tables} hint="Used to auto-generate your QR code batch">
        <FSelect id="tables" formData={formData} onValueChange={onValueChange} errors={errors}>
          <option value="">Select range</option>
          {TABLE_RANGES.map((r) => <option key={r}>{r}</option>)}
        </FSelect>
      </Field>
    </div>
  );
}

// ─── Step 2: Location & contact ───────────────────────────────────────────────

function StepLocation({ formData, onValueChange, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Full address" required error={errors.address}>
        <textarea
          id="address"
          value={formData.address ?? ""}
          onChange={(e) => onValueChange("address", e.target.value)}
          rows={2}
          placeholder="Shop no, building, street, area…"
          className={[inputCls(!!errors.address), "resize-none"].join(" ")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City" required error={errors.city}>
          <FInput id="city" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="e.g. Bengaluru" />
        </Field>
        <Field label="Pincode" required error={errors.pincode}>
          <FInput id="pincode" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="6-digit PIN" maxLength={6} />
        </Field>
      </div>

      <Field label="State" required error={errors.state}>
        <FSelect id="state" formData={formData} onValueChange={onValueChange} errors={errors}>
          <option value="">Select state</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </FSelect>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone number" required error={errors.phone}>
          <FInput id="phone" type="tel" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="+91 98765 43210" maxLength={13} />
        </Field>
        <Field label="WhatsApp number" hint="Order alerts will be sent here">
          <FInput id="whatsapp" type="tel" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="Same or different" maxLength={13} />
        </Field>
      </div>
    </div>
  );
}

// ─── Step 3: Owner / admin account ────────────────────────────────────────────

function StepAdmin({ formData, onValueChange, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner / admin name" required error={errors.ownerName}>
          <FInput id="ownerName" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="Full name" />
        </Field>
        <Field label="Designation">
          <FSelect id="designation" formData={formData} onValueChange={onValueChange} errors={errors}>
            <option value="">Select role</option>
            {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
          </FSelect>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GSTIN" hint="Required for GST-compliant billing invoices (CGST/SGST split)">
          <FInput id="gst" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="15-character GST number" maxLength={15} />
        </Field>

        <Field label="FSSAI licence no." hint="Printed on customer-facing digital receipts">
          <FInput id="fssai" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="14-digit FSSAI number" maxLength={14} />
        </Field>
      </div>
      <Field label="Email address" required error={errors.email} hint="Your login ID — trial credentials will be sent here">
        <FInput id="email" type="email" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="you@yourcafe.com" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" required error={errors.password} hint="Set a strong password for your account">
          <FInput id="password" type="password" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="At least 6 characters" />
        </Field>
        <Field label="Confirm password" required error={errors.confirmPassword} hint="Set a strong password for your account">
          <FInput id="confirmPassword" type="password" formData={formData} onValueChange={onValueChange} errors={errors} placeholder="At least 6 characters" />
        </Field>

      </div>

      <div className="mt-1 flex gap-2 rounded-[8px] border border-[#e8a030]/20 bg-[#e8a030]/6 p-3">
        <ShieldCheck size={14} className="mt-[2px] flex-shrink-0 text-[#e8a030]" aria-hidden="true" />
        <p className="text-[11px] leading-[1.6] text-[#fdf6ec]/50">
          Your data is encrypted and never shared. By continuing you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────

interface TagItem {
  Icon: LucideIcon;
  label: string;
}

function SuccessScreen() {
  const tags: TagItem[] = [
    { Icon: QrCode, label: "QR codes ready" },
    { Icon: ChefHat, label: "Kitchen display on" },
    { Icon: Mail, label: "Credentials sent" },
    { Icon: BarChart2, label: "Analytics live" },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
        <Check size={22} className="text-green-400" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-[18px] font-medium text-[#fdf6ec]">Trial activated!</h3>
      <p className="mb-5 max-w-[300px] text-[13px] leading-[1.7] text-[#fdf6ec]/50">
        Your 14-day free trial is live. Check your email for login credentials and your first QR code batch.
      </p>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {tags.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-[5px] rounded-full border border-white/10 bg-white/6 px-3 py-[5px] text-[11px] text-[#fdf6ec]/60"
          >
            <Icon size={12} className="text-[#e8a030]" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
      <button className="rounded-[8px] bg-[#e8a030] px-5 py-[9px] text-[13px] font-medium text-[#1a0f00] transition-colors hover:bg-[#d4902a]">
        Go to dashboard
      </button>
    </div>
  );
}

// ─── Progress dots ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: StepDotsProps) {
  return (
    <div className="mt-[14px] flex gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-[3px] flex-1 rounded-full transition-all duration-200",
            i < current ? "bg-[#e8a030]"
              : i === current ? "bg-[#e8a030]/45"
                : "bg-white/10",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── Trial signup modal ────────────────────────────────────────────────────────

function TrialSignupModal({ onClose }: TrialSignupModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [done, setDone] = useState(false);

  const handleChange = (id: string, value: string) => {
    setForm((f) => ({ ...f, [id]: value }));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: null }));
  };

  const saveCreateNewAccout = async () => {
    const response = await fetch("/api/CreateNewAccout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    console.log("API Response:", result);

    if (!response.ok) {
      throw new Error(result.message || "Failed to save Create New Accout");
    }

    return result;
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    STEP_REQUIRED[step].forEach((id) => {
      const msg = validators[id]?.(form[id] ?? "", form);
      if (msg) next[id] = msg;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    if (step === 2) {
      try {
        await saveCreateNewAccout();

        console.log("Create New Accout saved successfully");

        setDone(true);
      } catch (error) {
        console.error(error);
        alert("Failed to create free trial");
      }

      return;
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const stepPanels = [
    <StepCafeIdentity
      key={0}
      formData={form}
      onValueChange={handleChange}
      errors={errors}
    />,
    <StepLocation
      key={1}
      formData={form}
      onValueChange={handleChange}
      errors={errors}
    />,
    <StepAdmin
      key={2}
      formData={form}
      onValueChange={handleChange}
      errors={errors}
    />,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-[16px] border border-white/10 bg-[#181208]">

        {/* Header */}
        {!done && (
          <div className="border-b border-white/8 bg-[#e8a030]/8 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[17px] font-medium text-[#fdf6ec]">
                <Coffee size={18} className="text-[#e8a030]" aria-hidden="true" />
                Start your free Account
              </div>
              <button
                onClick={onClose}
                className="text-[#fdf6ec]/40 transition-colors hover:text-[#fdf6ec]/70"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-[3px] text-[12px] text-[#fdf6ec]/40">
              14 days free · No credit card required · Cancel anytime
            </p>
            <StepDots current={step} total={3} />
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            <SuccessScreen />
          ) : (
            <>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.05em] text-[#fdf6ec]/40">
                {STEP_LABELS[step]}
              </p>
              {stepPanels[step]}
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="flex items-center justify-between px-6 pb-6">
            <button
              onClick={handleBack}
              className={[
                "rounded-[8px] border border-white/12 px-[18px] py-[9px]",
                "text-[13px] text-[#fdf6ec]/60 transition-colors hover:bg-white/6",
                step === 0 ? "invisible pointer-events-none" : "",
              ].join(" ")}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-[6px] rounded-[8px] bg-[#e8a030] px-5 py-[9px] text-[13px] font-medium text-[#1a0f00] transition-colors hover:bg-[#d4902a]"
            >
              {step === 2 ? (
                <><Rocket size={14} aria-hidden="true" /> Activate free trial</>
              ) : (
                <>Continue <ArrowRight size={14} aria-hidden="true" /></>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SmartCafeLanding() {

  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && <TrialSignupModal onClose={() => setShowModal(false)} />}

      <div className="flex h-screen flex-col overflow-hidden bg-[#0e0b07] font-sans">

        {/* ── Topbar ── */}
        <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-white/8 px-7">
          <div className="flex items-center gap-3">
            <Coffee size={20} className="text-[#e8a030]" aria-hidden="true" />
            <span className="text-[15px] font-medium text-[#fdf6ec]">Smart Cafe</span>
            <span className="text-[12px] text-[#fdf6ec]/40">QR Ordering System</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e8a030]/30 bg-[#e8a030]/10 px-3 py-1 text-[12px] text-[#e8a030]">
            <QrCode size={13} aria-hidden="true" />
            Table-aware ordering
          </div>
        </header>

        {/* ── Main two-column grid ── */}
       <main className="relative z-10 grid flex-1 grid-cols-1 lg:grid-cols-2 overflow-hidden">

  {/* LEFT SIDE */}
  <section className="relative flex flex-col justify-center px-12 py-12">

    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

    <div className="relative z-10 max-w-xl mt-[-30px]">
      <h1 className="text-5xl font-bold leading-tight text-white">
        Transform Your Cafe
        <br />
        <span className="bg-gradient-to-r from-[#e8a030] to-[#ffd27d] bg-clip-text text-transparent">
           Into Digital
        </span>
      </h1>

      <p className="mt-2 text-lg leading-8 text-white/70">
        QR Ordering, Live Kitchen Tracking, Smart Billing,
        Customer Insights and Branch Management —
        all from one dashboard.
      </p>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-4">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="text-3xl font-bold text-[#e8a030]">500+</p>
          <p className="mt-1 text-xs text-white/60">
            Active Cafes
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="text-3xl font-bold text-[#e8a030]">1M+</p>
          <p className="mt-1 text-xs text-white/60">
            Orders Processed
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="text-3xl font-bold text-[#e8a030]">99.9%</p>
          <p className="mt-1 text-xs text-white/60">
            Uptime
          </p>
        </div>

      </div>

      {/* Steps */}
      <div className="mt-5 flex flex-col gap-4">

        {steps.map((step, i) => (
          <div
            key={step.title}
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8a030]/15 text-[#e8a030] font-semibold">
              {i + 1}
            </div>

            <div>
              <p className="font-medium text-white">
                {step.title}
              </p>

              <p className="mt-1 text-sm text-white/50">
                {step.desc}
              </p>
            </div>
          </div>
        ))}

      </div>

    </div>

  </section>

  {/* RIGHT SIDE */}
  <section className="flex items-center justify-center px-8">

    <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#e8a030]/20 blur-3xl" />

      <div className="relative z-10">

        <span className="inline-flex items-center rounded-full border border-[#e8a030]/30 bg-[#e8a030]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#e8a030]">
          Free Trial
        </span>

        <h2 className="mt-5 text-4xl font-bold text-white">
          Create Your Cafe Account
        </h2>

        <p className="mt-4 text-sm leading-7 text-white/60">
          Launch your digital ordering system in minutes.
          Generate QR codes, manage live orders,
          track kitchen workflow and grow your business.
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-3">

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
            📱 QR Ordering
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
            🍔 Menu Management
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
            🧾 Smart Billing
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
            📊 Analytics
          </div>

        </div>

        {/* Trial Tags */}
        <div className="mt-6 flex flex-wrap gap-2">

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            ✓ 14 Days Free
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            ✓ Unlimited Orders
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            ✓ No Credit Card
          </div>

        </div>

        {/* CTA */}
        <div className="mt-8 flex gap-4">

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e8a030] to-[#ffcb66] px-6 py-4 font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(232,160,48,0.45)]"
          >
            <Rocket size={18} />
            Create Free Account
          </button>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-medium text-white transition-all hover:bg-white/10">
            View Demo
          </button>

        </div>

      </div>

    </div>

  </section>

</main>
      </div>
    </>
  );
}