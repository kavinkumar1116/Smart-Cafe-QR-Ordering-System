import AppShell from "@/components/AppShell";
import CartExperience from "@/components/CartExperience";

type TenantCartPageProps = {
  params: { tenantSlug: string };
};

export default function TenantCartPage({ params }: TenantCartPageProps) {
  return (
    <AppShell title="Cart" subtitle={`Tenant: ${params.tenantSlug}`}>
      <CartExperience />
    </AppShell>
  );
}
