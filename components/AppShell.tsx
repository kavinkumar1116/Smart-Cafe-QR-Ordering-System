import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { ShellProps } from "@/types/cafe";

export default function AppShell({ children }: ShellProps) {
  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-72">
      <Sidebar />
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
