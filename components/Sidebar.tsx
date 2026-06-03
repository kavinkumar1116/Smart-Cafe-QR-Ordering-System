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
  ChevronDown,
} from "lucide-react";
import type { NavItem } from "@/types/cafe";
import { useSidebar } from "@/contexts/SidebarContext";
import { getSidebarWidthClass } from "@/lib/sidebar-layout";
import { cn } from "@/lib/utils";
import MobileDrawer from "@/components/MobileDrawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  {
    label: "Reports",
    icon: UtensilsCrossed,
    children: [
      { href: "/admin/reports/sales_report", label: "Sales Report", icon: BarChart3 },
      { href: "/admin/reports/order_report", label: "Order Report", icon: BarChart3 },
      { href: "/admin/reports/revenue_report", label: "Revenue Report", icon: BarChart3 },
    ],
  },
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
  const [collapsedFlyout, setCollapsedFlyout] = useState("");
  const { sidebarOpen, closeMobile, isHydrated, isDesktop } = useSidebar();

  const isCollapsed = isHydrated && !sidebarOpen && isDesktop;
  const showLabels = !isCollapsed;
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
      item.children?.some(
        (child) => pathname === child.href || pathname.startsWith(child.href)
      )
    );

    if (activeDropdown) {
      setOpenDropdown(activeDropdown.label);
    }
  }, [pathname, tenantNavItems]);

  useEffect(() => {
    if (!isCollapsed) {
      setCollapsedFlyout("");
    }
  }, [isCollapsed]);

  const handleNavClick = () => {
    closeMobile();
    setCollapsedFlyout("");
  };

  const linkPadding = isCollapsed ? "justify-center px-2" : "px-4";

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || pathname.startsWith(item.href || "");

    const link = (
      <Link
        href={item.href || "#"}
        className={cn(
          "group/sidebar-nav relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-300",
          linkPadding,
          isActive
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
            : "text-slate-700 hover:bg-slate-100 hover:shadow-sm"
        )}
        onClick={handleNavClick}
      >
        <Icon
          size={18}
          className={cn(
            "flex-shrink-0 transition-transform duration-200",
            !isActive && "group-hover/sidebar-nav:scale-110"
          )}
        />
        <span
          className={cn(
            "truncate transition-all duration-300",
            isChild && "text-xs",
            showLabels ? "opacity-100" : "hidden opacity-0"
          )}
        >
          {item.label}
        </span>
        {isActive && !isChild && !isCollapsed && (
          <div className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-emerald-600" />
        )}
      </Link>
    );

    if (isCollapsed && !isChild) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  const SidebarContent = () => (
    <>
      <div className={cn( isCollapsed ? "px-2" : "px-4")}>
        <Link
          href={withTenantSlug("/", tenantSlug)}
          className={cn(
            "flex items-center rounded-lg transition-colors duration-300 hover:bg-slate-100",
            isCollapsed ? "justify-center p-2" : "gap-3 p-3"
          )}
          onClick={handleNavClick}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md">
            <QrCode size={20} />
          </div>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300",
              showLabels ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            <p className="whitespace-nowrap text-sm font-bold text-slate-900">Smart Cafe</p>
            <p className="whitespace-nowrap text-xs text-slate-500">QR Billing Suite</p>
          </div>
        </Link>
      </div>

      <div className={cn("border-b border-slate-200", isCollapsed ? "mx-2" : "mx-4")} />

      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-4 app-scrollbar",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        {tenantNavItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const childActive = item.children?.some(
            (child) =>
              pathname === child.href || pathname.startsWith(child.href || "")
          );
          const isOpen = openDropdown === item.label;
          const flyoutOpen = collapsedFlyout === item.label;

          if (hasChildren) {
            if (isCollapsed) {
              return (
                <div key={item.label} className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedFlyout(flyoutOpen ? "" : item.label)
                        }
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all duration-300",
                          childActive
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
                            : "text-slate-700 hover:bg-slate-100 hover:shadow-sm"
                        )}
                        aria-expanded={flyoutOpen}
                      >
                        <Icon size={18} className="flex-shrink-0 transition-transform duration-200 hover:scale-110" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{item.label}</TooltipContent>
                  </Tooltip>
                  {flyoutOpen && (
                    <div className="absolute left-full top-0 z-[55] ml-2 w-52 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      {item.children?.map((child) => (
                        <NavLink key={child.label} item={child} isChild />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? "" : item.label)}
                  className={cn(
                    "group/sidebar-nav flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-100",
                    linkPadding
                  )}
                >
                  <Icon size={18} className="flex-shrink-0 transition-transform duration-200 group-hover/sidebar-nav:scale-110" />
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    {item.children?.map((child) => (
                      <NavLink key={child.label} item={child} isChild />
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

      <div className={cn("border-b border-slate-200", isCollapsed ? "mx-2" : "mx-4")} />

      <div className={cn("space-y-2 py-4", isCollapsed ? "px-2" : "px-3")}>
        {[
          { icon: CreditCard, label: "Current Plan" },
          { icon: Package, label: "Storage" },
          { icon: HelpCircle, label: "Support" },
        ].map(({ icon: BottomIcon, label }) => {
          const button = (
            <button
              type="button"
              className={cn(
                "group/sidebar-nav flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-100 hover:shadow-sm",
                linkPadding
              )}
            >
              <BottomIcon size={18} className="flex-shrink-0 transition-transform duration-200 group-hover/sidebar-nav:scale-110" />
              <span
                className={cn(
                  "truncate transition-all duration-300",
                  showLabels ? "opacity-100" : "hidden opacity-0"
                )}
              >
                {label}
              </span>
            </button>
          );

          if (!isCollapsed) {
            return <div key={label}>{button}</div>;
          }

          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white lg:flex",
          getSidebarWidthClass(sidebarOpen, isHydrated)
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SidebarContent />
        </div>
      </aside>

      <MobileDrawer>
        <SidebarContent />
      </MobileDrawer>
    </>
  );
}
