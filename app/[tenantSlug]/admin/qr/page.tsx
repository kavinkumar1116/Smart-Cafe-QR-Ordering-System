import AppShell from "@/components/AppShell";
import AdminQrCodes from "@/components/AdminQrCodes";

type TenantQrPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantQrPage({ params }: TenantQrPageProps) {
  const { tenantSlug } = await params;

  return (
    <AppShell title="QR Codes" subtitle={`Tenant: ${tenantSlug}`}>
      <AdminQrCodes />
    </AppShell>
  );
}
