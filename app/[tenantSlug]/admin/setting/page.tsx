import AppShell from "@/components/AppShell";
import AdminSettings from "@/components/AdminSettings";

type TenantSettingsPageProps = {
  params: { tenantSlug: string };
};

export default function TenantSettingsPage({ params }: TenantSettingsPageProps) {
  return (
    <AppShell title="Settings" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminSettings />
    </AppShell>
  );
}
