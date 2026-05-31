import AppShell from "@/components/AppShell";
import AdminQrCodes from "@/components/AdminQrCodes";

type TenantQrPageProps = {
  params: { tenantSlug: string };
};

export default function TenantQrPage({ params }: TenantQrPageProps) {
  return (
    <AppShell title="QR Codes" subtitle={`Tenant: ${params.tenantSlug}`}>
      <AdminQrCodes />
    </AppShell>
  );
}
