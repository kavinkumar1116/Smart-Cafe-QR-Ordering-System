import AppShell from "@/components/AppShell";
import AdminMenuManager from "@/components/AdminMenuManager";

type TenantAdminMenuPageProps = {
  params: { tenantSlug: string };
};

export default function TenantAdminMenuPage({ params }: TenantAdminMenuPageProps) {
  return (
    <AppShell title="Menu Management" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminMenuManager />
    </AppShell>
  );
}
