import { createVehicleAction } from "@/lib/data/actions";
import { getTransportPartners } from "@/lib/data/transport";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { VehicleForm } from "@/components/dashboard/vehicle-form";
import Link from "next/link";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NewVehiclePage({ searchParams }: { searchParams?: Promise<{ partnerId?: string }> }) {
  const params = await searchParams;
  const defaultPartnerId = params?.partnerId && uuidRegex.test(params.partnerId) ? params.partnerId : undefined;
  const partners = await getTransportPartners();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Vehicules / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau vehicule</h1>
        <p className="mt-2 text-sm text-muted-foreground">Creez un actif transport pret pour les transferts, circuits et packs.</p>
      </div>
      <FormErrorBanner />
      <form action={createVehicleAction} className="space-y-5">
        <VehicleForm partners={partners} defaultPartnerId={defaultPartnerId} />
        <div className="flex gap-3">
          <Button type="submit" className="w-full sm:w-auto">Creer le vehicule</Button>
          <Link href="/dashboard/partners/new"><Button variant="secondary" type="button">Creer nouveau partenaire</Button></Link>
        </div>
      </form>
    </div>
  );
}
