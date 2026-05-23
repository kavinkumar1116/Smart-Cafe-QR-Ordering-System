import AppShell from "@/components/AppShell";
import CartExperience from "@/components/CartExperience";

export default function CartPage() {
  return (
    <AppShell title="Cart" subtitle="Confirm customer details and place order">
      <CartExperience />
    </AppShell>
  );
}
