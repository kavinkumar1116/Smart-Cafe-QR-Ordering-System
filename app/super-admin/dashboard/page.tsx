import AppShell from "@/components/AppShell";

export default function SuperAdminDashboardPage() {
  return (
    <AppShell title="Super Admin Dashboard" subtitle="Manage tenants, subscriptions, and platform analytics">
      <div className="glass-panel rounded-3xl p-8 text-crema">
        <p className="text-lg font-semibold">Super admin control center</p>
        <p className="mt-4 text-sm text-crema/70">
          Use this area to review tenant activity, create new tenants, and manage subscription plans.
        </p>
      </div>
    </AppShell>
  );
}
