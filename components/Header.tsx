"use client";

import Link from "next/link";
import { ArrowRight, Bell, Coffee, UserRound } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = "Smart Cafe", subtitle = "QR Ordering System" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-espresso/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso shadow-soft">
            <Coffee size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-crema sm:text-xl">{title}</h1>
            <p className="truncate text-sm text-crema/62">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema transition hover:bg-white/14"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>
            <Link href="https://restaurant-menu-for-smart-cafe-qr-o.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-5 py-3 font-semibold text-espresso transition hover:bg-[#f0b556]"
              >
                View Storefront
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
          <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/8 px-3 py-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-white">
              <UserRound size={17} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium text-crema">Cafe Admin</p>
              <p className="text-xs text-crema/58">Live counter</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
