import AppShell from "@/components/AppShell";
import AdminCustomer from "@/components/AdminCustomer";

type TenantCustomersPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantCustomersPage({ params }: TenantCustomersPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Customers" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminCustomer />
    </AppShell>
  );
}
