"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { getSidebarShellOffset } from "@/lib/sidebar-layout";
import type { ShellProps } from "@/types/cafe";

function AppShellContent({ children }: ShellProps) {
  const { sidebarOpen, isHydrated } = useSidebar();

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar />
      <div className={getSidebarShellOffset(sidebarOpen, isHydrated)}>
        <Header />
        <main className="min-w-0 flex-1 overflow-x-auto pb-20 lg:pb-8">
          <div className="mx-auto max-w-7x2 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: ShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
