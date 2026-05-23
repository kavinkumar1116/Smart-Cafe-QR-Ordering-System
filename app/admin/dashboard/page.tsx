import AppShell from "@/components/AppShell";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <AppShell title="Admin Dashboard" subtitle="Analytics and restaurant performance">
      <AdminDashboard />
    </AppShell>
  );
}
