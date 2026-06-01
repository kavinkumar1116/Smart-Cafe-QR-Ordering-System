import AppShell from "@/components/AppShell";

type TenantWelcomePageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantHomePage({ params }: TenantWelcomePageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title={`Welcome to ${tenantSlug}`} subtitle="Start ordering or manage your restaurant">
      <div className="glass-panel rounded-3xl p-8 text-crema">
        <p className="text-lg font-semibold">Tenant entry page</p>
        <p className="mt-4 text-sm text-crema/70">
          Use the tenant-aware routes to access customer ordering and legacy admin flows.
        </p>
      </div>
    </AppShell>
  );
}
