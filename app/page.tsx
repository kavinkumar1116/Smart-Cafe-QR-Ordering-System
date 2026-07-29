"use client";

import { useState, ReactNode } from "react";
import {
  QrCode, Coffee, ChefHat, BarChart2, Mail, ShieldCheck,
  ArrowRight, Rocket, Check, Pencil, ChevronRight, Headphones,
  MoreVertical, CheckCircle2, UserPlus, Key, AlertCircle,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReviewEditFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  options?: string[];
  textarea?: boolean;
  required?: boolean;
  hint?: string;
  error?: string | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onValueChange: (id: string, value: string) => void;
  onBlur?: () => void;
}

interface SuccessScreenProps {
  tenantSlug: string | null;
}

// ─── Data constants ─────────────────────────────────────────────────────────────

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
  "Basic details",
  "Business details",
  "KYC details",
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

// ─── Inline Review & Edit Field component ────────────────────────────────────────

function ReviewEditField({
  id,
  label,
  value,
  placeholder = "",
  type = "text",
  options,
  textarea,
  required = false,
  hint,
  error,
  isEditing,
  onStartEdit,
  onValueChange,
  onBlur,
}: ReviewEditFieldProps) {
  // If not editing and it has a value, or is optional and empty, show review state.
  // Otherwise show input field.
  const showReview = !isEditing && (value.trim() !== "" || !required);

  if (showReview) {
    const displayValue = value.trim() !== "" ? value : "Skipped";
    return (
      <div className="group flex items-center justify-between border-b border-slate-100 py-3.5 transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
        <div className="flex flex-col gap-1 pr-4">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
          <span className={`text-[15px] ${value.trim() !== "" ? "text-slate-800 font-medium" : "text-slate-400 italic"}`}>
            {type === "password" ? "••••••••" : displayValue}
          </span>
        </div>
        <button
          type="button"
          onClick={onStartEdit}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          title={`Edit ${label}`}
        >
          <Pencil size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3 px-2">
      <label htmlFor={id} className="text-xs text-slate-600 font-semibold flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onValueChange(id, e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={2}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all ${error
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            }`}
          autoFocus
        />
      ) : options ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(e) => onValueChange(id, e.target.value)}
            onBlur={onBlur}
            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-800 bg-white outline-none transition-all appearance-none ${error
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
            autoFocus
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onValueChange(id, e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all ${error
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            }`}
          autoFocus
        />
      )}

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Success Screen component ──────────────────────────────────────────────────

function SuccessScreen({ tenantSlug }: SuccessScreenProps) {
  const tags = [
    { Icon: QrCode, label: "QR codes ready" },
    { Icon: ChefHat, label: "Kitchen display on" },
    { Icon: Mail, label: "Credentials sent" },
    { Icon: BarChart2, label: "Analytics live" },
  ];

  const handleGoToDashboard = () => {
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 text-center bg-white rounded-2xl">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
        <Check size={26} aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-slate-800">Trial activated!</h3>
      <p className="mb-6 max-w-[340px] text-[14px] leading-relaxed text-slate-500">
        Your 14-day free trial is live. Check your email for login credentials and your first QR code batch.
      </p>
      <div className="mb-8 flex flex-wrap justify-center gap-2.5">
        {tags.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50/50 px-3.5 py-1.5 text-xs font-semibold text-slate-600"
          >
            <Icon size={13} className="text-blue-500" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
      <button
        onClick={handleGoToDashboard}
        className="w-full max-w-[280px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 text-sm transition-all shadow-md shadow-blue-500/10 active:scale-[0.99]"
      >
        Go to dashboard
      </button>
    </div>
  );
}

// ─── Main Page / Stepper Redesign ────────────────────────────────────────────────

export default function SmartCafeLanding() {
  const [pageState, setPageState] = useState<"select_account" | "onboarding" | "success">("select_account");
  const [selectedOption, setSelectedOption] = useState<"new" | "existing">("new");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (id: string, value: string) => {
    setForm((f) => ({ ...f, [id]: value }));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: null }));
    if (apiError) setApiError(null);
  };

  const handleBlur = (id: string) => {
    const val = form[id] ?? "";
    const err = validators[id]?.(val, form) ?? null;
    if (!err) {
      setEditingFields((prev) => ({ ...prev, [id]: false }));
    } else {
      setErrors((prev) => ({ ...prev, [id]: err }));
    }
  };

  const handleStartEdit = (id: string) => {
    setEditingFields((prev) => ({ ...prev, [id]: true }));
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

  const validateStep = (stepIndex: number): boolean => {
    const currentFields = STEP_REQUIRED[stepIndex];
    const nextErrors: Record<string, string | null> = {};
    let isValid = true;

    currentFields.forEach((id) => {
      const val = form[id] ?? "";
      const err = validators[id]?.(val, form) ?? null;
      if (err) {
        nextErrors[id] = err;
        isValid = false;
        setEditingFields((prev) => ({ ...prev, [id]: true }));
      } else {
        setEditingFields((prev) => ({ ...prev, [id]: false }));
      }
    });

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return isValid;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 2) {
      try {
        setLoading(true);
        setApiError(null);
        const result = await saveCreateNewAccout();
        console.log("Create New Account saved successfully");

        const slug = result.data?.tenant_slug || result.data?.[0]?.tenant_slug || null;
        setTenantSlug(slug);
        setPageState("success");
      } catch (error: any) {
        console.error(error);
        setApiError(error.message || "Failed to create account. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleStepClick = (targetStep: number) => {
    setApiError(null);
    if (targetStep < step) {
      setStep(targetStep);
    } else if (targetStep > step) {
      let canAdvance = true;
      for (let i = step; i < targetStep; i++) {
        if (!validateStep(i)) {
          canAdvance = false;
          break;
        }
      }
      if (canAdvance) {
        setStep(targetStep);
      }
    }
  };

  // ─── Render View: Select Account ─────────────────────────────────────────────

  if (pageState === "select_account") {
    const isNewSelected = selectedOption === "new";
    const isExistingSelected = selectedOption === "existing";

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-white font-sans selection:bg-blue-100">
        {/* LEFT COLUMN: Aesthetic Gradient Panel + Background Video */}
        <section className="relative overflow-hidden flex flex-col justify-between p-8 lg:p-16 h-full lg:min-h-screen ">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src="/videos/185365-875417518_medium.mp4" type="video/mp4" />
          </video>

          {/* Overlay to ensure text readability & brand color tint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#dff7f9]/90 via-[#e8f7fa]/70 to-[#f3f9fc]/80 z-0 backdrop-blur-[1px]" />

          {/* Glowing gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-300/20 rounded-full filter blur-[80px] z-0 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-300/10 rounded-full filter blur-[100px] z-0 pointer-events-none" />

          {/* Decorative streaks */}
          <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
            <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#22d3ee]/40 to-transparent transform -rotate-45" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-[#3b82f6]/30 to-transparent transform -rotate-45" />
          </div>

          {/* Top: Branding logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Coffee size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">Smart Cafe</span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 text-sm font-medium text-blue">
              <QrCode size={18} />
              <span>QR Ordering System</span>
            </span>
          </div>

          {/* Center: Title info */}
          <div className="relative z-10 max-w-lg my-auto py-16">
            <h1 className="text-4xl lg:text-[42px] font-extrabold leading-[1.15] text-slate-800 tracking-tight">
              Join the Growing Community of Cafes Powered by Smart Cafe{" "}
              <span className="text-blue-600">Transforming</span> Your Business
            </h1>
          </div>

          {/* Bottom: Feature tags */}
          <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200/50 pt-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <span className="text-blue-500 text-lg font-bold">+</span> Table QR Ordering
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <span className="text-blue-500 text-lg font-bold">+</span> Easy Integration
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <span className="text-blue-500 text-lg font-bold">+</span> Powerful Dashboard
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Account Selection */}
        <section className="flex flex-col justify-center items-center px-6 py-12 lg:min-h-screen bg-[#fafafa]">
          <div className="w-full max-w-[420px] flex flex-col gap-8">
            {/* Blue Brand Symbol */}
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-600 shadow-lg shadow-blue-500/25">
              <Coffee size={26} className="text-white" />
            </div>

            {/* Title */}
            <div>
              <h2 className="text-[25px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Please select your preferred account
              </h2>
            </div>

            {/* Selection Card Options */}
            <div className="flex flex-col gap-4">
              {/* Option 1: Create a new account */}
              <button
                type="button"
                onClick={() => setSelectedOption("new")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${isNewSelected
                  ? "border-blue-600 bg-blue-50/10 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isNewSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-[14px]">Create a new account</p>
                    <p className="text-xs text-slate-500 mt-0.5">Get started with your 14-day free trial</p>
                  </div>
                </div>
                <ChevronRight size={18} className={isNewSelected ? "text-blue-600" : "text-slate-400"} />
              </button>

              {/* Divider */}
              {/* <div className="flex items-center my-2">
                <div className="flex-grow border-t border-slate-200" />
                <span className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-200" />
              </div> */}

              {/* Option 2: Existing pending account */}
              {/* <button
                type="button"
                onClick={() => setSelectedOption("existing")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  isExistingSelected
                    ? "border-blue-600 bg-blue-50/10 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm transition-colors ${
                      isExistingSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    AK
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-[14px] uppercase">Anbalagan Kavinkumar</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5">
                      <span className="text-slate-500">Created Jun '26 -</span>
                      <span className="text-red-500 font-semibold">Onboarding Pending</span>
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className={isExistingSelected ? "text-blue-600" : "text-slate-400"} />
              </button> */}
            </div>

            {/* Continue Button */}
            <button
              type="button"
              disabled={selectedOption !== "new"}
              onClick={() => {
                if (selectedOption === "new") {
                  setPageState("onboarding");
                  setStep(0);
                }
              }}
              className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${selectedOption === "new"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.99]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
            >
              Continue to Create a new account
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="relative flex items-center justify-center w-full">
            <div className="flex-grow border-t border-slate-300" />
            <span className="mx-4 bg-white px-2 text-sm font-medium uppercase tracking-wider text-slate-500">
              OR
            </span>
            <div className="flex-grow border-t border-slate-300" />
          </div>

          <div className="w-full max-w-[420px] flex flex-col gap-8">
            <button
              type="button"
              onClick={() => window.location.href = "/login"}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-green-700 active:scale-95"
            >
              Login as Admin
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ─── Render View: Onboarding Form (Images 1 style) ───────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* LEFT SIDEBAR: Stepper Layout */}
      <aside className="hidden md:flex flex-col w-[280px] border-r border-slate-100 bg-white flex-shrink-0 relative">
        {/* Green vertical bar on the absolute left */}
        <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#10b981]" />

        {/* Sidebar Header */}
        {/* <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs uppercase border border-slate-200">
              {form.ownerName ? form.ownerName.trim().substring(0, 2).toUpperCase() : "KK"}
            </div>
            <span className="text-[14px] font-bold text-slate-800 tracking-tight truncate max-w-[140px]" title={form.ownerName || "Kavinkumar"}>
              {form.ownerName || "Kavinkumar"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <button type="button" className="p-1 hover:text-slate-600 transition-colors" title="Support">
              <Headphones size={16} />
            </button>
            <button type="button" className="p-1 hover:text-slate-600 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div> */}

        {/* Sidebar Steps */}
        <div className="flex-1 py-8 px-6 flex flex-col gap-6 pl-8">
          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarding:</span>
            <span className="text-[14px] font-bold text-slate-800">Smart Cafe Account</span>
          </div>

          {STEP_LABELS.map((label, idx) => {
            const isActive = step === idx;
            const isCompleted = step > idx;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleStepClick(idx)}
                className={`flex items-center justify-between w-full p-2.5 rounded-lg text-left transition-all ${isActive
                  ? "bg-slate-50 text-slate-800 font-bold shadow-sm"
                  : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300"
                        }`}
                    >
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  )}
                  <span className="text-[13px]">{label}</span>
                </div>
                {idx > 0 && <ChevronRight size={14} className="text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        {/* <div className="p-6 border-t border-slate-100 flex flex-col gap-4 pl-8">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Test Mode</span>
            <button
              type="button"
              onClick={() => setTestMode(!testMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors outline-none ${
                testMode ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  testMode ? "translate-x-[18px]" : "translate-x-[4px]"
                }`}
              />
            </button>
          </div>

       
          <button
            type="button"
            onClick={() => alert("Test API keys generated. Check your email.")}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors text-left"
          >
            <Key size={13} className="rotate-45 text-blue-600" />
            Get Test API Keys
          </button>
        </div> */}
      </aside>

      {/* RIGHT CONTENT AREA: Mesh Gradients + Card */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#f4f7fb]">
        {/* Soft background light mesh gradients */}
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-cyan-200/20 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-200/20 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="flex items-center justify-center p-6 lg:p-12 min-h-full relative z-10">
          <div className="w-full max-w-[580px] bg-white rounded-2xl border border-slate-100 p-8 lg:p-10 shadow-lg shadow-slate-100/50 flex flex-col gap-6">

            {pageState === "success" ? (
              <SuccessScreen tenantSlug={tenantSlug} />
            ) : (
              <>
                {/* Card Brand Header */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2">
                    <Coffee size={13} />
                    <span>Smart Cafe Account</span>
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">
                    Review/ Edit
                  </h3>
                  <p className="text-3xl font-extrabold text-slate-400 mt-1">
                    {STEP_LABELS[step]}
                  </p>
                </div>

                {/* Inline Fields Lists */}
                <div className="flex flex-col gap-1 min-h-[300px]">
                  {step === 0 && (
                    <>
                      <ReviewEditField
                        id="cafeName"
                        label="Cafe / restaurant name"
                        value={form.cafeName || ""}
                        placeholder="e.g. Brew & Bloom Cafe"
                        required
                        error={errors.cafeName}
                        isEditing={editingFields.cafeName !== false}
                        onStartEdit={() => handleStartEdit("cafeName")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("cafeName")}
                      />
                      <ReviewEditField
                        id="brand"
                        label="Brand / chain name"
                        value={form.brand || ""}
                        placeholder="e.g. Brewmasters (optional)"
                        hint="Leave blank if independent"
                        error={errors.brand}
                        isEditing={editingFields.brand !== false}
                        onStartEdit={() => handleStartEdit("brand")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("brand")}
                      />
                      <ReviewEditField
                        id="branch"
                        label="Branch name"
                        value={form.branch || ""}
                        placeholder="e.g. Koramangala Branch"
                        required
                        error={errors.branch}
                        isEditing={editingFields.branch !== false}
                        onStartEdit={() => handleStartEdit("branch")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("branch")}
                      />
                      <ReviewEditField
                        id="outletType"
                        label="Type of outlet"
                        value={form.outletType || ""}
                        placeholder="Select outlet type"
                        required
                        options={OUTLET_TYPES}
                        error={errors.outletType}
                        isEditing={editingFields.outletType !== false}
                        onStartEdit={() => handleStartEdit("outletType")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("outletType")}
                      />
                      <ReviewEditField
                        id="tables"
                        label="Number of tables"
                        value={form.tables || ""}
                        placeholder="Select range"
                        required
                        options={TABLE_RANGES}
                        hint="Used to auto-generate your QR code batch"
                        error={errors.tables}
                        isEditing={editingFields.tables !== false}
                        onStartEdit={() => handleStartEdit("tables")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("tables")}
                      />
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <ReviewEditField
                        id="address"
                        label="Full address"
                        value={form.address || ""}
                        placeholder="Shop no, building, street, area…"
                        required
                        textarea
                        error={errors.address}
                        isEditing={editingFields.address !== false}
                        onStartEdit={() => handleStartEdit("address")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("address")}
                      />
                      <ReviewEditField
                        id="city"
                        label="City"
                        value={form.city || ""}
                        placeholder="e.g. Bengaluru"
                        required
                        error={errors.city}
                        isEditing={editingFields.city !== false}
                        onStartEdit={() => handleStartEdit("city")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("city")}
                      />
                      <ReviewEditField
                        id="pincode"
                        label="Pincode"
                        value={form.pincode || ""}
                        placeholder="6-digit PIN"
                        required
                        error={errors.pincode}
                        isEditing={editingFields.pincode !== false}
                        onStartEdit={() => handleStartEdit("pincode")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("pincode")}
                      />
                      <ReviewEditField
                        id="state"
                        label="State"
                        value={form.state || ""}
                        placeholder="Select state"
                        required
                        options={STATES}
                        error={errors.state}
                        isEditing={editingFields.state !== false}
                        onStartEdit={() => handleStartEdit("state")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("state")}
                      />
                      <ReviewEditField
                        id="phone"
                        label="Phone number"
                        value={form.phone || ""}
                        placeholder="+91 98765 43210"
                        required
                        error={errors.phone}
                        isEditing={editingFields.phone !== false}
                        onStartEdit={() => handleStartEdit("phone")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("phone")}
                      />
                      <ReviewEditField
                        id="whatsapp"
                        label="WhatsApp number"
                        value={form.whatsapp || ""}
                        placeholder="Same or different (optional)"
                        hint="Order alerts will be sent here"
                        error={errors.whatsapp}
                        isEditing={editingFields.whatsapp !== false}
                        onStartEdit={() => handleStartEdit("whatsapp")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("whatsapp")}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <ReviewEditField
                        id="ownerName"
                        label="Owner / admin name"
                        value={form.ownerName || ""}
                        placeholder="Full name"
                        required
                        error={errors.ownerName}
                        isEditing={editingFields.ownerName !== false}
                        onStartEdit={() => handleStartEdit("ownerName")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("ownerName")}
                      />
                      <ReviewEditField
                        id="designation"
                        label="Designation"
                        value={form.designation || ""}
                        placeholder="Select role"
                        options={DESIGNATIONS}
                        error={errors.designation}
                        isEditing={editingFields.designation !== false}
                        onStartEdit={() => handleStartEdit("designation")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("designation")}
                      />
                      <ReviewEditField
                        id="gst"
                        label="GSTIN"
                        value={form.gst || ""}
                        placeholder="15-character GST number (optional)"
                        hint="Required for GST-compliant billing invoices"
                        error={errors.gst}
                        isEditing={editingFields.gst !== false}
                        onStartEdit={() => handleStartEdit("gst")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("gst")}
                      />
                      <ReviewEditField
                        id="fssai"
                        label="FSSAI licence no."
                        value={form.fssai || ""}
                        placeholder="14-digit FSSAI number (optional)"
                        hint="Printed on customer-facing digital receipts"
                        error={errors.fssai}
                        isEditing={editingFields.fssai !== false}
                        onStartEdit={() => handleStartEdit("fssai")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("fssai")}
                      />
                      <ReviewEditField
                        id="email"
                        type="email"
                        label="Email address"
                        value={form.email || ""}
                        placeholder="you@yourcafe.com"
                        required
                        hint="Your login ID — trial credentials will be sent here"
                        error={errors.email}
                        isEditing={editingFields.email !== false}
                        onStartEdit={() => handleStartEdit("email")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("email")}
                      />
                      <ReviewEditField
                        id="password"
                        type="password"
                        label="Password"
                        value={form.password || ""}
                        placeholder="At least 6 characters"
                        required
                        hint="Set a strong password for your account"
                        error={errors.password}
                        isEditing={editingFields.password !== false}
                        onStartEdit={() => handleStartEdit("password")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("password")}
                      />
                      <ReviewEditField
                        id="confirmPassword"
                        type="password"
                        label="Confirm password"
                        value={form.confirmPassword || ""}
                        placeholder="At least 6 characters"
                        required
                        hint="Passwords must match"
                        error={errors.confirmPassword}
                        isEditing={editingFields.confirmPassword !== false}
                        onStartEdit={() => handleStartEdit("confirmPassword")}
                        onValueChange={handleChange}
                        onBlur={() => handleBlur("confirmPassword")}
                      />

                      <div className="mt-4 flex gap-2 rounded-lg border border-blue-100 bg-blue-50/20 p-3.5">
                        <ShieldCheck size={16} className="mt-[2px] flex-shrink-0 text-blue-600" aria-hidden="true" />
                        <p className="text-[11px] leading-relaxed text-slate-500">
                          Your data is encrypted and never shared. By continuing you agree to our terms of service and privacy policy.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* API Error Display */}
                {apiError && (
                  <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-start gap-2 animate-fadeIn">
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-rose-500" aria-hidden="true" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Card Continue Button */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="px-5 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 text-sm transition-all"
                    >
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleNext}
                    className={`flex-1 py-3.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 ${loading ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                  >
                    {step === 2 ? (
                      <>
                        {loading ? (
                          <>
                            <svg className="h-[14px] w-[14px] animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <Rocket size={14} aria-hidden="true" />
                            Activate Free Trial
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={14} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
