"use client";

import {
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Menu,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCafeStore } from "@/src/store/useCafeStore";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

// ─── Notification helpers ─────────────────────────────────────────────────────

type NotifType = "expired" | "expiring_soon" | "expiring" | null;
interface CafeStore {
  tenantSlug: string;
  setTenantSlug: (tenantSlug: string) => void;
}

function getSubscriptionNotif(
  status: string | number,
  expiringDate: string
): NotifType {
  const isExpired =
    String(status).toLowerCase() === "expired" ||
    String(status) === "0";

  if (isExpired) return "expired";
  if (expiringDate !== "") {
    // Parse remaining days from store date string (YYYY-MM-DD or formatted)
    const end = new Date(expiringDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3) return "expiring_soon";
    return "expiring";
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const [openProfile, setOpenProfile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { toggleMenu, sidebarOpen, isDesktop, mobileOpen, isHydrated } = useSidebar();
  const [openNotifications, setOpenNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const restaurantName = useCafeStore((state) => state.restaurantName);
  const branchName = useCafeStore((state) => state.branchName);
  const logo = useCafeStore((state) => state.logo);
  const resetCafeProfile = useCafeStore((state) => state.resetCafeProfile);
  const subscriptionExpiringDate = useCafeStore((state) => state.subscriptionExpiringDate);
  const subscriptionStatus = useCafeStore((state) => state.subscriptionStatus);
  const tenantSlug = useCafeStore((state) => state.tenantSlug);
  const setTenantSlug = useCafeStore((state) => state.setTenantSlug);

  // ── Derived notification state ──────────────────────────────────────────────
  const notifType = getSubscriptionNotif(subscriptionStatus, subscriptionExpiringDate);
  const hasNotification = notifType !== null;

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setOpenNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Page meta ───────────────────────────────────────────────────────────────
  const getPageTitle = () => {
    if (pathname.includes("dashboard")) return "Dashboard";
    if (pathname.includes("order")) return "Live Orders";
    if (pathname.includes("orders_list")) return "Orders";
    if (pathname.includes("menu_master")) return "Menu Items";
    if (pathname.includes("category_master")) return "Categories";
    if (pathname.includes("table_master")) return "Tables";
    if (pathname.includes("qr")) return "QR Codes";
    if (pathname.includes("customers")) return "Customers";
    if (pathname.includes("setting")) return "Settings";
    if (pathname.includes("subscriptions")) return "Billing & Subscription";
    return "Smart Cafe";
  };

  const getPageSubtitle = () => {
    if (pathname.includes("dashboard")) return "Overview of your cafe operations";
    if (pathname.includes("order")) return "Manage and track live orders";
    if (pathname.includes("orders_list")) return "Manage and track all orders";
    if (pathname.includes("menu_master")) return "Manage your menu items";
    if (pathname.includes("category_master")) return "Organize menu categories";
    if (pathname.includes("table_master")) return "Manage cafe tables";
    if (pathname.includes("qr")) return "Generate and manage QR codes";
    if (pathname.includes("customers")) return "View customer information";
    if (pathname.includes("setting")) return "Cafe settings and configuration";
    if (pathname.includes("subscriptions")) return "Billing and plan details";
    return "QR-based cafe ordering system";
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      resetCafeProfile();
      const AUTH_KEY = "smart-cafe-admin=true";
      document.cookie = AUTH_KEY;
      localStorage.setItem(AUTH_KEY, "false");
      document.cookie = "smart-cafe-admin=;";
      window.location.href = `/${encodeURIComponent(tenantSlug)}/login`;
      // window.location.href = "/mycafe/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const userInitial = restaurantName.charAt(0).toUpperCase();

  const menuAriaLabel = isDesktop
    ? sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
    : "Open navigation menu";

  // ── Notification card content ───────────────────────────────────────────────
  const NotificationCard = () => {
    // Compute exact days left from subscriptionExpiringDate
    const daysLeft = (() => {
      if (!subscriptionExpiringDate) return null;
      const end = new Date(subscriptionExpiringDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    })();

    const daysLabel =
      daysLeft === null ? null :
        daysLeft <= 0 ? "less than 1 day" :
          daysLeft === 1 ? "1 day" :
            `${daysLeft} days`;

    if (!hasNotification) {
      return (
        <div className="px-4 py-8 text-center">
          <Bell size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">No new notifications</p>
        </div>
      );
    }

    if (notifType === "expired") {
      return (
        <div className="border-b border-slate-100 px-4 py-3 hover:bg-red-50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <XCircle size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">
                Subscription Expired
              </p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                Your subscription has expired. Renew now to continue using Smart Cafe without interruption.
              </p>
              {subscriptionExpiringDate !== "" && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  Expired on: {subscriptionExpiringDate}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (notifType === "expiring_soon") {
      return (
        <div className="border-b border-slate-100 px-4 py-3 hover:bg-amber-50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Expiring Very Soon!
              </p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                Your subscription is expiring in{" "}
                <strong className="text-amber-600">{daysLabel ?? "less than 1 day"}</strong>.
                {" "}Upgrade now to avoid service interruption.
              </p>
              <p className="mt-1 text-xs font-medium text-amber-600">
                Expires on: {subscriptionExpiringDate}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // "expiring" — normal upcoming expiry
    return (
      <div className="border-b border-slate-100 px-4 py-3 hover:bg-blue-50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Subscription Expiring
            </p>
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Your current plan will expire soon. Consider upgrading to continue uninterrupted service.
            </p>
            <p className="mt-1 text-xs font-medium text-blue-600">
              Expires on: {subscriptionExpiringDate}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Bell dot color by severity ──────────────────────────────────────────────
  const bellDotClass =
    notifType === "expired"
      ? "bg-red-500"
      : notifType === "expiring_soon"
        ? "bg-amber-500"
        : "bg-blue-500";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Spacer to prevent main content from layout shifting under the fixed header */}
      <div className="h-[88px]" aria-hidden="true" />
      <header className={cn(
        "fixed top-0 right-0 z-30 left-0 border-b border-slate-200 bg-white/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
        (!isHydrated || sidebarOpen) ? "lg:left-[280px]" : "lg:left-[80px]"
      )}>
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Menu toggle + Page Title */}
            <div className="flex flex-1 min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={toggleMenu}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                aria-label={menuAriaLabel}
                aria-controls="mobile-sidebar-drawer"
                aria-expanded={isDesktop ? sidebarOpen : mobileOpen}
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-slate-900">
                  {getPageTitle()}
                </h1>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* ── Notification Bell ── */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setOpenNotifications(!openNotifications);
                    setOpenProfile(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
                  aria-label="Notifications"
                >
                  <Bell size={20} />

                  {/* ✅ Dot — only shown when there's a real notification */}
                  {hasNotification && (
                    <span
                      className={`absolute right-2 top-2 flex h-2 w-2 rounded-full ${bellDotClass} ring-2 ring-white`}
                    />
                  )}
                </button>

                {openNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 overflow-hidden rounded border border-slate-200 bg-white shadow-xl">

                    {/* Notif header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Notifications
                        </h3>
                        {hasNotification && (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${notifType === "expired" ? "bg-red-500" :
                              notifType === "expiring_soon" ? "bg-amber-500" : "bg-blue-500"
                              }`}
                          >
                            1
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notification cards */}
                    <div className="max-h-[350px] overflow-y-auto">
                      <NotificationCard />
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 p-3">
                      <button className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {/* ── Profile dropdown ── */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setOpenProfile(!openProfile)}
                  className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-semibold">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline">{restaurantName}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${openProfile ? "rotate-180" : ""}`}
                  />
                </button>

                {openProfile && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-200 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-lg">
                          {userInitial}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {restaurantName}
                          </h3>
                          <p className="text-xs text-slate-500">Admin Account</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-200 px-4 py-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">Cafe Name</p>
                          <p className="text-sm font-medium text-slate-900">{restaurantName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">Branch</p>
                          <p className="text-sm font-medium text-slate-900">{branchName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-2 space-y-1">
                      <div className="border-t border-slate-200 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>
    </>
  );
}

// function getAdminLoginPath(pathname: string): string {
//   const parts = pathname.split("/").filter(Boolean);
//   if (parts[0] && parts[0] !== "admin" && parts[0] !== "super-admin") {
//     return `/${encodeURIComponent(parts[0])}/admin`;
//   }
//   return "/admin";
// }