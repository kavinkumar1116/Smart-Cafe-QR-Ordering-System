"use client";

import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
} from "lucide-react";
import Image from "next/image";
import defaultLogo from "@/public/assets/logo.png";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { tenantApiFetch } from "@/lib/tenant";
import { useCafeStore } from "@/src/store/useCafeStore";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOwner, setProfileOwner] = useState("Not signed in");
  const [openProfile, setOpenProfile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { toggleMenu, sidebarOpen, isDesktop, mobileOpen } = useSidebar();

  const restaurantName = useCafeStore((state) => state.restaurantName);
  const branchName = useCafeStore((state) => state.branchName);
  const logo = useCafeStore((state) => state.logo);
  const setCafeProfile = useCafeStore((state) => state.setCafeProfile);

  const getPageTitle = () => {
    if (pathname.includes("dashboard")) return "Dashboard";
    if (pathname.includes("orders_list")) return "Orders";
    if (pathname.includes("menu_master")) return "Menu Items";
    if (pathname.includes("category_master")) return "Categories";
    if (pathname.includes("table_master")) return "Tables";
    if (pathname.includes("qr")) return "QR Codes";
    if (pathname.includes("customers")) return "Customers";
    if (pathname.includes("setting")) return "Settings";
    return "Smart Cafe";
  };

  const getPageSubtitle = () => {
    if (pathname.includes("dashboard")) return "Overview of your cafe operations";
    if (pathname.includes("orders_list")) return "Manage and track all orders";
    if (pathname.includes("menu_master")) return "Manage your menu items";
    if (pathname.includes("category_master")) return "Organize menu categories";
    if (pathname.includes("table_master")) return "Manage cafe tables";
    if (pathname.includes("qr")) return "Generate and manage QR codes";
    if (pathname.includes("customers")) return "View customer information";
    if (pathname.includes("setting")) return "Cafe settings and configuration";
    return "QR-based cafe ordering system";
  };

  useEffect(() => {
    async function loadCafeProfile() {
      const response = await tenantApiFetch("/api/admin/settings", { cache: "no-store" });
      const data = (await response.json()) as {
        settings?: {
          restaurantName?: string;
          branchName?: string;
          logo?: string;
          gstNumber?: string;
          contactNumber?: string;
        };
      };

      if (response.ok && data.settings) {
        setCafeProfile(data.settings);
      }
    }

    void loadCafeProfile();
  }, [setCafeProfile]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setProfileOwner(data.user?.email || "Not signed in");
    }

    void loadUser();
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setOpenProfile(false);
    router.push(getAdminLoginPath(pathname));
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const userInitial = profileOwner.charAt(0).toUpperCase();

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

          {/* Center: Search Bar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search orders, items..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="flex md:hidden h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Search size={20} />
            </button>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell size={20} />
              <span className="absolute right-2 top-2 flex h-2 w-2 items-center justify-center rounded-full bg-red-500"></span>
            </button>

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
                <span className="hidden sm:inline">{restaurantName || "Cafe"}</span>
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
                          {profileOwner}
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
                    <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                      <User size={16} />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                      <Settings size={16} />
                      Settings
                    </button>
                    <div className="border-t border-slate-200 my-1"></div>
                    <button
                      onClick={signOut}
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
