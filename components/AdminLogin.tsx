"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { FormEvent } from "react";

export default function AdminLogin() {
  const router = useRouter();
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
      router.push("/");
      return;
    }

    setError(signInError.message || "Invalid admin credentials.");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-5xl place-items-center">
      <form onSubmit={submit} className="glass-panel w-full max-w-md rounded-lg p-6 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-saffron text-espresso">
          <LockKeyhole size={24} aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-crema">Admin Login</h2>
        <p className="mt-2 text-sm leading-6 text-crema/62">
          Access live orders, menu inventory, and QR table tools.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">Email</span>
            <input
              value={form.email}
              type="email"
              autoComplete="email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">Password</span>
            <input
              value={form.password}
              type="password"
              autoComplete="current-password"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p> : null}

        <button
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn size={18} aria-hidden="true" />
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
