import AppShell from "@/components/AppShell";
import AdminGuard from "@/components/AdminGuard";
import AdminCategoryMaster from "@/components/AdminCategoryMaster"; 

export default function CategoryMasterPage() {
  return (
    <AppShell title="Category Master" subtitle="Manage cafe menu categories">
      <AdminGuard>
        <AdminCategoryMaster />
      </AdminGuard>
    </AppShell>
  );
}
