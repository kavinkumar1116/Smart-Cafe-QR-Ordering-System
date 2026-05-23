import AppShell from "@/components/AppShell";
import AdminLogin from "@/components/AdminLogin";

export default function AdminPage() {
  return (
    <AppShell title="Admin" subtitle="Secure dashboard access">
      <AdminLogin />
    </AppShell>
  );
}
