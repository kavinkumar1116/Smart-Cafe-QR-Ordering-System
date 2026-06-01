import AppShell from "@/components/AppShell";

export default function SuperAdminTenantsPage() {
  return (
    <AppShell title="Tenants" subtitle="Review and manage platform tenants">
      <div className="glass-panel rounded-3xl p-8 text-crema">
        <p className="text-lg font-semibold">Tenant Management</p>
        <p className="mt-4 text-sm text-crema/70">
          This module will list all tenants, allow suspend/activate actions, and provide tenant-level analytics.
        </p>
      </div>
    </AppShell>
  );
}
