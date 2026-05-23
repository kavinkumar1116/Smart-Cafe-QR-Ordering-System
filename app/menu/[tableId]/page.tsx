import AppShell from "@/components/AppShell";
import MenuExperience from "@/components/MenuExperience";

interface MenuPageProps {
  params: Promise<{ tableId: string }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { tableId } = await params;

  return (
    <AppShell title="Customer Menu" subtitle={`Table ${tableId} ordering`}>
      <MenuExperience tableId={tableId} />
    </AppShell>
  );
}
