import AppShell from "@/components/AppShell";
import AdminDashboard from "@/components/AdminDashboard";

type TenantAdminDashboardPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAdminDashboardPage({ params }: TenantAdminDashboardPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Admin Dashboard" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminDashboard />
    </AppShell>
  );
}
