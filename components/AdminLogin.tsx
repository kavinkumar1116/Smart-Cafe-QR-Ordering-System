"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, ArrowLeft, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";

// ─── Forgot-password step type ───────────────────────────────────────────────
type ForgotStep = "email" | "otp" | "newPassword";

// ─── Forgot-password sub-form state ──────────────────────────────────────────
interface ForgotState {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminLogin() {
  const router = useRouter();

  // ── Existing login state (unchanged) ──────────────────────────────────────
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Forgot-password state ─────────────────────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [backtoLogin, setBackToLogin] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotData, setForgotData] = useState<ForgotState>({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ── Existing submit handler (unchanged) ───────────────────────────────────
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/AdminLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Invalid admin credentials.");
        return;
      }

      const tenantSlug = result.data.tenant_slug;

      const AUTH_KEY = "smart-cafe-admin=true";
      document.cookie = AUTH_KEY;
      localStorage.setItem(AUTH_KEY, "true");

      router.refresh();
      router.push(`/${tenantSlug}/admin/dashboard`);
    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot-password: Step 1 — send OTP to email ───────────────────────────
  async function handleSendOtp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      const response = await fetch("/api/AdminForgotPassword/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotData.email.trim() }),
      });

      const result = await response.json();

      if (!result.success) {
        setForgotError(result.message || "Could not send OTP. Please try again.");
        return;
      }

      setForgotStep("otp");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Forgot-password: Step 2 — verify OTP ─────────────────────────────────
  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      const response = await fetch("/api/AdminForgotPassword/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotData.email.trim(),
          otp: forgotData.otp.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setForgotError(result.message || "Invalid or expired OTP.");
        return;
      }

      setForgotStep("newPassword");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Forgot-password: Step 3 — reset password ─────────────────────────────
  async function handleResetPassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setForgotError("");

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    if (forgotData.newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters.");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch("/api/AdminForgotPassword/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotData.email.trim(),
          otp: forgotData.otp.trim(),
          newPassword: forgotData.newPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setForgotError(result.message || "Failed to reset password.");
        return;
      }

      setForgotSuccess("Password reset successfully! You can now log in.");
      // Auto-close after 2.5 s and reset everything
      setTimeout(() => {
        closeForgot();
      }, 2500);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Helper: close & reset the forgot-password flow ───────────────────────
  function closeForgot() {
    setShowForgot(false);
    setForgotStep("email");
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setForgotData({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  }

  // ── Shared input class ────────────────────────────────────────────────────
  const inputClass =
    "w-full rounded-lg border border-white/30 bg-white/90 px-3 py-3 text-black placeholder:text-black/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* ── Login Card (unchanged layout) ─────────────────────────────────── */}
      {(!showForgot || showNewPassword || showConfirmPassword) && (


        <div className="relative z-10 w-full max-w-md px-4">
          <form
            onSubmit={submit}
            className="rounded-xl border border-white/20 bg-transparent p-6 shadow-2xl backdrop-blur-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <LockKeyhole size={24} aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-white">Admin Login</h2>

            <p className="mt-2 text-sm leading-6 text-white/80">
              Access live orders, menu inventory, and QR table tools.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-white">Email</span>
                <input
                  placeholder="Enter your email"
                  className={inputClass}
                  value={form.email}
                  type="email"
                  autoComplete="email"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white">
                  Password
                </span>

                <div className="relative">
                  <input
                    placeholder="Enter your password"
                    className={`${inputClass} pr-12`}
                    value={form.password}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center">
                {/* ── "Forgot password?" now opens the modal ─────────────── */}
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="ml-0 block text-sm leading-6 text-white hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} aria-hidden="true" />
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      )}

      {/* ── Forgot-password Modal ──────────────────────────────────────────── */}
      {showForgot && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          {/* Modal backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeForgot}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-xl border border-white/20 bg-transparent p-6 shadow-2xl backdrop-blur-md ">

            {/* ── Step indicator ────────────────────────────────────────── */}
            <div className="mb-5 flex items-center gap-2">
              {(["email", "otp", "newPassword"] as ForgotStep[]).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${forgotStep === step
                        ? "bg-emerald-600 text-white"
                        : ["email", "otp", "newPassword"].indexOf(forgotStep) > i
                          ? "bg-emerald-800 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      }`}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-px w-8 transition-colors ${["email", "otp", "newPassword"].indexOf(forgotStep) > i
                          ? "bg-emerald-600"
                          : "bg-white/20"
                        }`}
                    />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs text-white/50">
                {forgotStep === "email"}
                {forgotStep === "otp"}
                {forgotStep === "newPassword"}
              </span>
            </div>

            {/* ── Success banner (shown after reset) ────────────────────── */}
            {forgotSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-900/40 p-3 text-sm text-emerald-300">
                {forgotSuccess}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 1 — Email
            ════════════════════════════════════════════════════════════ */}
            {forgotStep === "email" && (
              <form onSubmit={handleSendOtp}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Mail size={20} aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-white">
                  Forgot Password
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Enter your admin email and we'll send a one-time password (OTP) to reset your account.
                </p>

                <div className="mt-5">
                  <label className="block">
                    <span className="mb-2 block text-sm text-white">Email address</span>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="admin@yourcafe.com"
                      className={inputClass}
                      value={forgotData.email}
                      onChange={(e) =>
                        setForgotData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </label>
                </div>

                {forgotError && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {forgotError}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="flex items-center gap-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 2 — OTP Verification
            ════════════════════════════════════════════════════════════ */}
            {forgotStep === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <KeyRound size={20} aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-white">Enter OTP</h3>
                <p className="mt-1 text-sm text-white/70">
                  A 6-digit OTP was sent to{" "}
                  <span className="font-medium text-emerald-400">{forgotData.email}</span>.
                  It expires in 10 minutes.
                </p>

                <div className="mt-5">
                  <label className="block">
                    <span className="mb-2 block text-sm text-white">OTP</span>
                    <input
                      type="text"
                      required
                      autoFocus
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      className={inputClass}
                      value={forgotData.otp}
                      onChange={(e) =>
                        setForgotData((prev) => ({
                          ...prev,
                          otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={() => {
                    setForgotError("");
                    setForgotLoading(true);
                    fetch("/api/AdminForgotPassword/send-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotData.email.trim() }),
                    })
                      .then((r) => r.json())
                      .then((result) => {
                        if (!result.success) {
                          setForgotError(result.message || "Could not resend OTP.");
                        }
                      })
                      .catch(() => setForgotError("Something went wrong."))
                      .finally(() => setForgotLoading(false));
                  }}
                  className="mt-3 text-xs text-white/50 hover:text-emerald-400 transition-colors disabled:opacity-40"
                >
                  Didn't receive it? Resend OTP
                </button>

                {forgotError && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {forgotError}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setForgotStep("email"); setForgotError(""); }}
                    className="flex items-center gap-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotData.otp.length < 6}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 3 — New Password
            ════════════════════════════════════════════════════════════ */}
            {forgotStep === "newPassword" && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <LockKeyhole size={20} aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-white">
                  Set New Password
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Choose a strong password for your admin account.
                </p>

                <div className="mt-5 space-y-4">
                  {/* New password */}
                  <label className="block">
                    <span className="mb-2 block text-sm text-white">New Password</span>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        autoFocus
                        minLength={8}
                        placeholder="Min. 8 characters"
                        className={`${inputClass} pr-10`}
                        value={forgotData.newPassword}
                        onChange={(e) =>
                          setForgotData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  {/* Confirm password */}
                  <label className="block">
                    <span className="mb-2 block text-sm text-white">Confirm Password</span>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="Re-enter new password"
                        className={`${inputClass} pr-10`}
                        value={forgotData.confirmPassword}
                        onChange={(e) =>
                          setForgotData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Live match indicator */}
                    {forgotData.confirmPassword && (
                      <p
                        className={`mt-1.5 text-xs ${forgotData.newPassword === forgotData.confirmPassword
                            ? "text-emerald-400"
                            : "text-red-400"
                          }`}
                      >
                        {forgotData.newPassword === forgotData.confirmPassword
                          ? "✓ Passwords match"
                          : "✗ Passwords do not match"}
                      </p>
                    )}
                  </label>
                </div>

                {forgotError && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {forgotError}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setForgotStep("otp"); setForgotError(""); }}
                    className="flex items-center gap-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      forgotLoading ||
                      forgotData.newPassword !== forgotData.confirmPassword ||
                      forgotData.newPassword.length < 8
                    }
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Unchanged helper (kept as-is) ─────────────────────────────────────────────
function getPostLoginPath(tenantSlug: string) {
  const firstSegment = tenantSlug.split("/").filter(Boolean)[0] || "";
  const decodedSegment = decodeURIComponent(firstSegment);

  console.log("Decoded first segment:", decodedSegment);

  if (
    !decodedSegment ||
    decodedSegment === "admin" ||
    decodedSegment === "super-admin" ||
    decodedSegment === "{tenantSlug}"
  ) {
    return "/admin/dashboard";
  }

  return `/${tenantSlug}/admin/dashboard`;
}