import AppShell from "@/components/AppShell";
  import AdminMenuManager from "@/components/AdminMenuManager";

  export default function AdminMenuMasterPage() {
    return (
    <AppShell title="Admin Menu Master" subtitle="Manage menu items">
      <AdminMenuManager />
    </AppShell>
  );
}
