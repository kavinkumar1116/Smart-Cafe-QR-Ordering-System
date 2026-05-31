import AppShell from "@/components/AppShell";
import AdminCustomer from "@/components/AdminCustomer";

type TenantCustomersPageProps = {
  params: { tenantSlug: string };
};

export default function TenantCustomersPage({ params }: TenantCustomersPageProps) {
  return (
    <AppShell title="Customers" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminCustomer />
    </AppShell>
  );
}
