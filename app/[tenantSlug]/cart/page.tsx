import AppShell from "@/components/AppShell";
import CartExperience from "@/components/CartExperience";

type TenantCartPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantCartPage({ params }: TenantCartPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="Cart" subtitle={`Tenant: ${tenantSlug}`}>
      <CartExperience />
    </AppShell>
  );
}
