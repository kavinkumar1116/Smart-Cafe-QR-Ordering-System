import AppShell from "@/components/AppShell";
import AdminSettings from "@/components/AdminSettings";

export default function AdminSettingsPage() {
  return (
    <AppShell title="Admin Settings" subtitle="Configure restaurant operations, billing, QR ordering, and staff access">
      <AdminSettings />
    </AppShell>
  );
}
