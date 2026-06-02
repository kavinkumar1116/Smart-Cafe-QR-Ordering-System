import AppShell from "@/components/AppShell";
import AdminReports from "@/components/AdminReports";

type TenantReportsPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantReportsPage({ params }: TenantReportsPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Reports" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminReports />
    </AppShell>
  );
}