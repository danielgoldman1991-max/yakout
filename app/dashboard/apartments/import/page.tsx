import { getOwners } from "@/lib/data/owners";
import { AirbnbImportForm } from "@/components/dashboard/airbnb-import-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function AirbnbApartmentImportPage() {
  const owners = await getOwners();
  return <div className="mx-auto max-w-6xl space-y-6"><div><p className="text-sm text-muted-foreground">Dashboard / Appartements / Import</p><h1 className="mt-2 text-3xl font-semibold">Importer un appartement depuis Airbnb</h1><p className="mt-2 max-w-3xl text-muted-foreground">Récupérez les informations publiques de votre propre annonce, vérifiez-les, puis créez une fiche Yakout.</p></div><AirbnbImportForm owners={owners.map((owner) => ({ id: owner.id, label: owner.full_name }))} /></div>;
}
