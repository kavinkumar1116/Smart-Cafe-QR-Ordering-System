import AppShell from "@/components/AppShell";
import OrderStatus from "@/components/OrderStatus";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return (
    <AppShell title="Order Tracking" subtitle="Live order status and receipt">
      <OrderStatus id={id} />
    </AppShell>
  );
}
