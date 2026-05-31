import AppShell from "@/components/AppShell";
import Order from "@/components/Order";

type TenantOrderPageProps = {
  params: { tenantSlug: string };
};

export default function TenantOrderPage({ params }: TenantOrderPageProps) {
  return (
    <AppShell title="Customer Order" subtitle={`Tenant: ${params.tenantSlug}`}>
      <Order />
    </AppShell>
  );
}
