import AppShell from "@/components/AppShell";
import Order from "@/components/Order";

type TenantOrderPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantOrderPage({ params }: TenantOrderPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Customer Order" subtitle={`Tenant: ${tenantSlug}`}>
      <Order />
    </AppShell>
  );
}
