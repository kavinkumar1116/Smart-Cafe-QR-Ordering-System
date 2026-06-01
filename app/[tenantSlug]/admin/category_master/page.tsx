import AppShell from "@/components/AppShell";
import AdminCategoryManager from "@/components/AdminCategoryMaster";

type TenantCategoryMasterPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantCategoryMasterPage({ params }: TenantCategoryMasterPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Category Management" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminCategoryManager />
    </AppShell>
  );
}
