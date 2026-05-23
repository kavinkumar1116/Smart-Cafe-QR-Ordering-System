import AppShell from "@/components/AppShell";
import AdminOrders from "@/components/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <AppShell title="Admin Orders" subtitle="Manage live cafe orders">
      <AdminOrders />
    </AppShell>
  );
}