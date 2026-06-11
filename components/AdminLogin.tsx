"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { FormEvent } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (!signInError) {
      router.push(getPostLoginPath(pathname));
      return;
    }

    setError(signInError.message || "Invalid admin credentials.");
  }

  return (<div
    className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80')",
    }}
  >
    {/* Dark overlay */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

    {/* Login Card */}
    <div className="relative z-10 w-full max-w-md px-4">
      <form
        onSubmit={submit}
        className="rounded-xl border border-white/20 bg-transparent p-6 shadow-2xl backdrop-blur-md"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <LockKeyhole size={24} aria-hidden="true" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-white">
          Admin Login
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/80">
          Access live orders, menu inventory, and QR table tools.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-white">Email</span>
            <input
              placeholder="Enter your email"
              className="
                  w-full rounded-lg
                  border border-white/30
                  bg-white/90
                  px-3 py-3
                  text-black
                  placeholder:text-black/60
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-500/20
                "
              value={form.email}
              type="email"
              autoComplete="email"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
             />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white">
              Password
            </span>
            <input
              placeholder="Enter your password"
              className="
                  w-full rounded-lg
                  border border-white/30
                  bg-white/90
                  px-3 py-3
                  text-black
                  placeholder:text-black/60
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-500/20
                "
              value={form.password}
              type="password"
              autoComplete="current-password"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
               />
          </label>
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
  </div>
  );
}

function getPostLoginPath(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const decodedSegment = decodeURIComponent(firstSegment);

  if (!decodedSegment || decodedSegment === "admin" || decodedSegment === "super-admin" || decodedSegment === "{tenantSlug}") {
    return "/admin/dashboard";
  }

  return `/${decodedSegment}/admin/dashboard`;
}
