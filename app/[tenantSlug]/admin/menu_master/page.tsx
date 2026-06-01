import AppShell from "@/components/AppShell";
import AdminMenuManager from "@/components/AdminMenuManager";

type TenantAdminMenuPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAdminMenuPage({ params }: TenantAdminMenuPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Menu Management" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminMenuManager />
    </AppShell>
  );
}
