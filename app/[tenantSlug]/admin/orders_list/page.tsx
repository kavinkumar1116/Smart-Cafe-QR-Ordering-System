import AppShell from "@/components/AppShell";
import AdminOrders from "@/components/AdminOrders";

type TenantOrdersListPageProps = {
  params: { tenantSlug: string };
};

export default function TenantOrdersListPage({ params }: TenantOrdersListPageProps) {
  return (
    <AppShell title="Orders" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminOrders />
    </AppShell>
  );
}
