import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { ShellProps } from "@/types/cafe";

export default function AppShell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar />
      <Header />
      <main className="pb-20 lg:pb-8 lg:ml-sidebar">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
