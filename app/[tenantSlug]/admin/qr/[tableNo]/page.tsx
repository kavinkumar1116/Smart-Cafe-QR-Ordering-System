import QrMenuExperience from "@/components/restaurant-menu/QrMenuExperience";

type QrMenuPageProps = {
  params: Promise<{
    tenantSlug: string;
    tableNo: string;
  }>;
};

export default async function QrMenuPage({ params }: QrMenuPageProps) {
  const { tenantSlug, tableNo } = await params;

  return <QrMenuExperience tenantSlug={tenantSlug} tableNo={tableNo} />;
}
