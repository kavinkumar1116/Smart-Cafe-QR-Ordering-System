import AppShell from "@/components/AppShell";
import AdminLogin from "@/components/AdminLogin";

type TenantCartPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantCartPage({ params }: TenantCartPageProps) {
  const { tenantSlug } = await params;

  return (
      <AdminLogin />
  );
}
