import AppShell from "@/components/AppShell";
import AdminRevenueReport from "@/components/AdminRevenueReport";

type TenantRevenueReportPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantRevenueReportPage({
  params,
}: TenantRevenueReportPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Revenue Reports" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminRevenueReport />
    </AppShell>
  );
}
