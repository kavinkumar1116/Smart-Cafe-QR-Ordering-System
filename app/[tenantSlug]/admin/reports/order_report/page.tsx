import AppShell from "@/components/AppShell";
import AdminOrderReports from "@/components/AdminOrderReports";

type TenantOrderReportPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantOrderReportPage({
  params,
}: TenantOrderReportPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Order Reports" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminOrderReports />
    </AppShell>
  );
}
