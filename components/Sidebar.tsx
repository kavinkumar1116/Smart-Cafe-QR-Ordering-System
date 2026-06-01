"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Clock,
  ChefHat,
  Table2,
  QrCode,
  UtensilsCrossed,
  Layers,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Users2,
  Settings,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X,
} from "lucide-react";
import type { NavItem } from "@/types/cafe";
import { Button } from "@/components/ui/Button";

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },  
  { href: "/order", label: "Live Orders", icon: Clock },
  { href: "/admin/orders_list", label: "Orders List", icon: ShoppingCart },
  { href: "/admin/kot", label: "Kitchen (KOT)", icon: ChefHat },
  { href: "/admin/table_master", label: "Tables", icon: Table2 },
  { href: "/admin/qr", label: "QR Codes", icon: QrCode },
  {
    label: "Menu Management",
    icon: UtensilsCrossed,
    children: [
      { href: "/admin/menu_master", label: "Menu Items", icon: UtensilsCrossed },
      { href: "/admin/category_master", label: "Categories", icon: Layers },
    ],
  },
  { href: "/admin/customers", label: "Customers", icon: Users2 },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/repoert", label: "Reports", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/setting", label: "Settings", icon: Settings },
];

function getTenantSlug(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const decodedSegment = decodeURIComponent(firstSegment);

  if (
    !decodedSegment ||
    decodedSegment === "admin" ||
    decodedSegment === "super-admin" ||
    decodedSegment === "{tenantSlug}"
  ) {
    return "";
  }

  return decodedSegment;
}

function withTenantSlug(href: string | undefined, tenantSlug: string) {
  if (!href) return "/";
  if (!tenantSlug) return href;
  if (href === "/") return `/${tenantSlug}`;

  return `/${tenantSlug}${href}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const tenantSlug = getTenantSlug(pathname);

  const tenantNavItems = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        href: withTenantSlug(item.href, tenantSlug),
        children: item.children?.map((child) => ({
          ...child,
          href: withTenantSlug(child.href, tenantSlug),
        })),
      })),
    [tenantSlug]
  );

  useEffect(() => {
    const activeDropdown = tenantNavItems.find((item) =>
      item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href))
    );

    if (activeDropdown) {
      setOpenDropdown(activeDropdown.label);
    }
  }, [pathname, tenantNavItems]);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href || "");

    return (
      <Link
        href={item.href || "#"}
        className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
            : "text-slate-700 hover:bg-slate-100"
        }`}
        onClick={handleNavClick}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className={isChild ? "text-xs" : ""}>{item.label}</span>
        {isActive && !isChild && (
          <div className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-emerald-600"></div>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="px-4 py-6">
        <Link href={withTenantSlug("/", tenantSlug)} className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-100 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md">
            <QrCode size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">Smart Cafe</p>
            <p className="text-xs text-slate-500">QR Billing Suite</p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 border-b border-slate-200"></div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {tenantNavItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const childActive = item.children?.some(
            (child) => pathname === child.href || pathname.startsWith(child.href || "")
          );
          const isOpen = openDropdown === item.label;

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setOpenDropdown(isOpen ? "" : item.label)}
                  className="w-full group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    {item.children?.map((child) => (
                      <NavLink key={child.label} item={child} isChild={true} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.label}>
              <NavLink item={item} />
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-b border-slate-200"></div>

      {/* Bottom Section */}
      <div className="space-y-2 px-3 py-4">
        <button className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200">
          <CreditCard size={18} />
          <span>Current Plan</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200">
          <Package size={18} />
          <span>Storage</span>
        </button>
        <button className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200">
          <HelpCircle size={18} />
          <span>Support</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-sidebar lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Menu Button */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
            <QrCode size={16} />
          </div>
          <span className="text-sm font-bold text-slate-900">Smart Cafe</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden">
          <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white overflow-y-auto app-scrollbar">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
