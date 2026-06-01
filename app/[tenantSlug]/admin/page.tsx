import AppShell from "@/components/AppShell";
import AdminLogin from "@/components/AdminLogin";

type TenantAdminPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAdminPage({ params }: TenantAdminPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Admin" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminLogin />
    </AppShell>
  );
}
