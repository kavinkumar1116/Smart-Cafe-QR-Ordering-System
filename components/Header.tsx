"use client";

import {
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCafeStore } from "@/src/store/useCafeStore";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [openProfile, setOpenProfile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { toggleMenu, sidebarOpen, isDesktop, mobileOpen } = useSidebar();
  const [openNotifications, setOpenNotifications] = useState(false);

  const restaurantName = useCafeStore((state) => state.restaurantName);

  const branchName = useCafeStore((state) => state.branchName);

  const logo = useCafeStore((state) => state.logo);

  const resetCafeProfile = useCafeStore((state) => state.resetCafeProfile);

  const subscriptionExpiringDate = useCafeStore((state) => state.subscriptionExpiringDate);

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
    if (pathname.includes("subscriptions")) return "Current Plan";
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
    if (pathname.includes("subscriptions")) return "Current plan details";
    return "QR-based cafe ordering system";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      resetCafeProfile();
      const AUTH_KEY = "smart-cafe-admin=true";
      document.cookie = AUTH_KEY;
      localStorage.setItem(AUTH_KEY, "false");

      document.cookie = "smart-cafe-admin=;";
      window.location.href = "/mycafe/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const userInitial = restaurantName.charAt(0).toUpperCase();

  const menuAriaLabel =
    isDesktop
      ? sidebarOpen
        ? "Collapse sidebar"
        : "Expand sidebar"
      : "Open navigation menu";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
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
            <div className="relative">
              <button
                onClick={() => {
                  setOpenNotifications(!openNotifications);
                  setOpenProfile(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
              >
                <Bell size={20} />

                {subscriptionExpiringDate !== "" && <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />}
              </button>

              {openNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Notifications
                      </h3>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[350px] overflow-y-auto">

                    <div className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
                      <div className="flex gap-3">
                        {subscriptionExpiringDate !== "" && (
                          <>
                            <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />

                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                Subscription Expiring
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {subscriptionExpiringDate}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
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

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setOpenProfile(!openProfile)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-semibold">
                  {userInitial}
                </div>
                <span className="hidden sm:inline">{restaurantName}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${openProfile ? "rotate-180" : ""}`} />
              </button>

              {openProfile && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
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
                    <div className="border-t border-slate-200 my-1"></div>
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
  );
}

function getAdminLoginPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && parts[0] !== "admin" && parts[0] !== "super-admin") {
    return `/${encodeURIComponent(parts[0])}/admin`;
  }
  return "/admin";
}
