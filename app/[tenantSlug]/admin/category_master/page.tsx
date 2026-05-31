import AppShell from "@/components/AppShell";
import AdminCategoryManager from "@/components/AdminCategoryMaster";

type TenantCategoryMasterPageProps = {
  params: { tenantSlug: string };
};

export default function TenantCategoryMasterPage({ params }: TenantCategoryMasterPageProps) {
  return (
    <AppShell title="Category Management" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminCategoryManager />
    </AppShell>
  );
}
