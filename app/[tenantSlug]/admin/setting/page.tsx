import AppShell from "@/components/AppShell";
import AdminSettings from "@/components/AdminSettings";

type TenantSettingsPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantSettingsPage({ params }: TenantSettingsPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Settings" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminSettings />
    </AppShell>
  );
}
