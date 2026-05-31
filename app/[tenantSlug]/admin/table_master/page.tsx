import AppShell from "@/components/AppShell";
import AdminTableMaster from "@/components/AdminTableMaster";

type TenantTableMasterPageProps = {
  params: { tenantSlug: string };
};

export default function TenantTableMasterPage({ params }: TenantTableMasterPageProps) {
  return (
    <AppShell title="Table Management" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminTableMaster />
    </AppShell>
  );
}
