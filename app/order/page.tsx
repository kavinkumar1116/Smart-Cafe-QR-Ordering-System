import AppShell from "@/components/AppShell";
import Order from "@/components/Order";

export default function AdminMenuPage() {
  return (
    <AppShell title="Customer Order" subtitle="Place your order here">
      <Order />
    </AppShell>
  );
}
