"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import type { FormEvent } from "react";

const AUTH_KEY = "smart-cafe-admin";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "admin", password: "1234" });
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (form.username === "admin" && form.password === "1234") {
      localStorage.setItem(AUTH_KEY, "true");
      router.push("/admin/orders");
      return;
    }
    setError("Invalid admin credentials.");
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
            <span className="mb-2 block text-sm text-crema/70">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-crema/70">Password</span>
            <input
              value={form.password}
              type="password"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none focus:border-saffron"
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p> : null}

        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso">
          <LogIn size={18} aria-hidden="true" />
          Login
        </button>
      </form>
    </div>
  );
}
