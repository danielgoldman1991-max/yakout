import Link from "next/link";
import { Building2 } from "lucide-react";
import { createApartmentAction } from "@/lib/data/actions";
import { getOwnerById } from "@/lib/data/owners";
import { getOwnersForSelect } from "@/lib/data";
import { ApartmentForm } from "@/components/dashboard/apartment-form";
import { Badge } from "@/components/ui/badge";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewApartmentPage({ searchParams }: { searchParams?: Promise<{ error?: string; ownerId?: string; owner_id?: string }> }) {
  const params = await searchParams;
  const error = params?.error;
  const ownerId = params?.ownerId ?? params?.owner_id;
  const ownerIdValid = Boolean(ownerId && uuidRegex.test(ownerId));
  const [owners, owner] = await Promise.all([
    getOwnersForSelect(),
    ownerIdValid ? getOwnerById(ownerId!) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Appartements / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouvel appartement</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Creez une fiche CMS complete pour un bien confie, avec statut de gestion, contenu public et galerie.
        </p>
      </div>

      {owner && (
        <div className="rounded-sm border border-border bg-accent/20 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bien rattache au proprietaire</p>
              <Link href={`/dashboard/owners/${owner.id}`} className="font-medium text-foreground hover:underline">
                {owner.full_name}
              </Link>
            </div>
            {owner.phone && <span className="text-sm text-muted-foreground">{owner.phone}</span>}
            <Badge tone="default">{owner.status}</Badge>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <ApartmentForm action={createApartmentAction} owners={owners} defaultOwnerId={ownerIdValid ? ownerId : undefined} />
    </div>
  );
}
