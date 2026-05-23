import AppShell from "@/components/AppShell";
import AdminQrCodes from "@/components/AdminQrCodes";

export default function AdminQrPage() {
  return (
    <AppShell title="Admin QR" subtitle="Generate and download table QR codes">
      <AdminQrCodes />
    </AppShell>
  );
}
