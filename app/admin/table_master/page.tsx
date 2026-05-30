import AppShell from "@/components/AppShell";
import AdminGuard from "@/components/AdminGuard";
import AdminTableMaster from "@/components/AdminTableMaster";

export default function TableMasterPage() {
  return (
    <AppShell title="Table Master" subtitle="Manage cafe table numbers">
      <AdminGuard>
        <AdminTableMaster />
      </AdminGuard>
    </AppShell>
  );
}
