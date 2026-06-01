import AppShell from "@/components/AppShell";

export default function SuperAdminSubscriptionsPage() {
  return (
    <AppShell title="Subscriptions" subtitle="Configure plans and monitor tenant billing">
      <div className="glass-panel rounded-3xl p-8 text-crema">
        <p className="text-lg font-semibold">Subscription Plans</p>
        <p className="mt-4 text-sm text-crema/70">
          Use this section to manage trial, basic, premium, and enterprise plans for tenants.
        </p>
      </div>
    </AppShell>
  );
}
