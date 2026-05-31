import AppShell from "@/components/AppShell";
import AdminDashboard from "@/components/AdminDashboard";

type TenantAdminDashboardPageProps = {
  params: { tenantSlug: string };
};
alert();
export default function TenantAdminDashboardPage({ params }: TenantAdminDashboardPageProps) {
  return (
    <AppShell title="Admin Dashboard" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminDashboard />
    </AppShell>
  );
}
