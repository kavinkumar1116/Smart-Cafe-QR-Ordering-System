import AppShell from "@/components/AppShell";
import AdminOrders from "@/components/AdminCustomer";

export default function AdminOrdersPage() {
  return (
    <AppShell title="Admin Customers" subtitle="Manage customer information">
      <AdminOrders />
    </AppShell>
  );
}