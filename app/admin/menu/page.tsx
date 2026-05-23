import AppShell from "@/components/AppShell";
import AdminMenuManager from "@/components/AdminMenuManager";

export default function AdminMenuPage() {
  return (
    <AppShell title="Admin Menu" subtitle="Add, edit, and remove cafe items">
      <AdminMenuManager />
    </AppShell>
  );
}
