import AppShell from "@/components/AppShell";
import AdminTableMaster from "@/components/AdminTableMaster";

type TenantTableMasterPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantTableMasterPage({ params }: TenantTableMasterPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Table Management" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminTableMaster />
    </AppShell>
  );
}
