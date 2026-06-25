import AppShell from "@/components/AppShell";
import AdminSupport from "@/components/AdminSupport";

type TenantAdminSupportPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAdminSupportPage({ params }: TenantAdminSupportPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Subscriptions Management" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminSupport />
    </AppShell>
  );
}
