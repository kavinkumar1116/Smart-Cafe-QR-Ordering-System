"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Armchair, ChevronDown, Home, ListOrdered, QrCode, Settings, Soup, Utensils, FileUser } from "lucide-react";
import type { NavItem } from "@/types/cafe";

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/order", label: "Order", icon: ListOrdered },
  { href: "/admin/orders_list", label: "Orders List", icon: Soup },
  { href: "/admin/qr", label: "QR Codes", icon: QrCode },
  {
    label: "Menu",
    icon: Utensils,
    children: [
      { href: "/admin/menu_master", label: "Menu Items", icon: Utensils },
      { href: "/admin/category_master", label: "Category", icon: Utensils },
      { href: "/admin/table_master", label: "Tables", icon: Armchair },
    ],
  },
  { href: "/admin/customers", label: "Customers", icon: FileUser  },
  { href: "/admin/setting", label: "Settings", icon: Settings },
  
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState("");

  useEffect(() => {
    const activeDropdown = navItems.find((item) =>
      item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href))
    );

    if (activeDropdown) {
      setOpenDropdown(activeDropdown.label);
    }
  }, [pathname]);

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-[#17110f]/96 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-lg px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-saffron text-espresso">
            <QrCode size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-crema">Smart Cafe</p>
            <p className="text-xs text-crema/55">QR Billing Suite</p>
          </div>
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children?.length);
            const childActive = item.children?.some(
              (child) => pathname === child.href || pathname.startsWith(child.href)
            );
            const dropdownOpen = openDropdown === item.label || childActive;
            const active = Boolean(item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));

            if (hasChildren) {
              const children = item.children || [];
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown((current) => (current === item.label ? "" : item.label))
                    }
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      childActive
                        ? "bg-saffron text-espresso"
                        : "text-crema/72 hover:bg-white/10 hover:text-crema"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition ${dropdownOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {dropdownOpen ? (
                    <div className="mt-2 space-y-1 pl-6">
                      {children.map((child) => {
                        const ChildIcon = child.icon;
                        const childLinkActive =
                          pathname === child.href || pathname.startsWith(child.href);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                              childLinkActive
                                ? "bg-white/16 text-crema"
                                : "text-crema/62 hover:bg-white/10 hover:text-crema"
                            }`}
                          >
                            <ChildIcon size={16} aria-hidden="true" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href || "/"}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-saffron text-espresso"
                    : "text-crema/72 hover:bg-white/10 hover:text-crema"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid border-t border-white/10 bg-[#17110f]/96 px-2 pb-2 pt-2 backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const childActive = item.children?.some(
            (child) => pathname === child.href || pathname.startsWith(child.href)
          );
          const dropdownOpen = openDropdown === item.label || childActive;
          const active = Boolean(item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));

          if (hasChildren) {
            const children = item.children || [];
            return (
              <div key={item.label} className="relative">
                {dropdownOpen ? (
                  <div className="absolute bottom-[4.25rem] left-1/2 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-[#17110f] p-2 shadow-soft">
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      const childLinkActive =
                        pathname === child.href || pathname.startsWith(child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                            childLinkActive ? "bg-saffron text-espresso" : "text-crema/72"
                          }`}
                        >
                          <ChildIcon size={15} aria-hidden="true" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown((current) => (current === item.label ? "" : item.label))
                  }
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition ${
                    childActive ? "bg-saffron text-espresso" : "text-crema/70"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href || "/"}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition ${
                active ? "bg-saffron text-espresso" : "text-crema/70"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
