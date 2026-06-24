import AppShell from "@/components/AppShell";
import AdminSubscriptions from "@/components/AdminSubscriptions";

type TenantAdminSubscriptionsPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAdminSubscriptionsPage({ params }: TenantAdminSubscriptionsPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Subscriptions Management" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminSubscriptions />
    </AppShell>
  );
}
