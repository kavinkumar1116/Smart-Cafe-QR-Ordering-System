import AppShell from "@/components/AppShell";
import AdminOrders from "@/components/AdminOrders";

type TenantOrdersListPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantOrdersListPage({ params }: TenantOrdersListPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Orders" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminOrders />
    </AppShell>
  );
}
