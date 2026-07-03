import Image from "next/image";
import Link from "next/link";
import { Building2, Camera, FileText, PenLine, Plus, Receipt } from "lucide-react";
import { getDashboardApartments } from "@/lib/data";
import { getOwners } from "@/lib/data/owners";
import { getApartmentImages } from "@/lib/data/apartments";
import { deleteApartmentAction } from "@/lib/data/actions";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApartmentStatusBadges } from "@/components/dashboard/apartment-status-badges";
import { fallbackImages } from "@/lib/images";

export default async function DashboardApartmentsPage({ searchParams }: { searchParams?: Promise<{ filter?: string; owner?: string; district?: string }> }) {
  const params = await searchParams;
  const [apartments, owners] = await Promise.all([getDashboardApartments(), getOwners()]);
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));
  const imagePairs = await Promise.all(apartments.map(async (apartment) => [apartment.id, await getApartmentImages(apartment.id)] as const));
  const imageMap = new Map(imagePairs);

  const filtered = apartments.filter((apartment) => {
    const images = imageMap.get(apartment.id) ?? [];
    if (params?.owner && apartment.owner_id !== params.owner) return false;
    if (params?.district && apartment.district !== params.district) return false;
    switch (params?.filter) {
      case "published": return apartment.public_status === "published" || apartment.is_published;
      case "draft": return (apartment.public_status ?? "draft") === "draft";
      case "onboarding": return ["prospect", "info_missing", "visit_scheduled", "preparation"].includes(apartment.management_status ?? "");
      case "contract_missing": return (apartment.contract_status ?? "missing") === "missing";
      case "no_photo": return images.length === 0 && !apartment.image_url;
      case "paused": return apartment.public_status === "paused" || apartment.management_status === "paused";
      default: return true;
    }
  });

  const kpis = [
    ["Total biens", apartments.length],
    ["Biens publies", apartments.filter((a) => a.public_status === "published" || a.is_published).length],
    ["En onboarding", apartments.filter((a) => ["prospect", "info_missing", "visit_scheduled", "preparation"].includes(a.management_status ?? "")).length],
    ["Contrats manquants", apartments.filter((a) => (a.contract_status ?? "missing") === "missing").length],
    ["Sans photos", apartments.filter((a) => (imageMap.get(a.id) ?? []).length === 0 && !a.image_url).length],
    ["Gestion active", apartments.filter((a) => a.management_status === "active_management").length],
  ] as const;

  const filters = [
    ["Tous", "/dashboard/apartments"],
    ["Publies", "/dashboard/apartments?filter=published"],
    ["Brouillons", "/dashboard/apartments?filter=draft"],
    ["Onboarding", "/dashboard/apartments?filter=onboarding"],
    ["Contrat manquant", "/dashboard/apartments?filter=contract_missing"],
    ["Sans photo", "/dashboard/apartments?filter=no_photo"],
    ["En pause", "/dashboard/apartments?filter=paused"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Appartements</p>
          <h1 className="mt-2 text-3xl font-semibold">Appartements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Biens confies, onboarding proprietaire, publication site, photos, documents, finances et maintenance.
          </p>
        </div>
        <Link href="/dashboard/apartments/new">
          <Button><Plus className="h-4 w-4" /> Nouvel appartement</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold/30 hover:text-gold">
            {label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Aucun appartement enregistre pour le moment. Ajoutez un bien confie ou creez un appartement a publier sur le site.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-accent/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Nom public</th>
                  <th className="px-4 py-3 font-medium">Proprietaire</th>
                  <th className="px-4 py-3 font-medium">Quartier</th>
                  <th className="px-4 py-3 font-medium">Capacite</th>
                  <th className="px-4 py-3 font-medium">Prix/nuit</th>
                  <th className="px-4 py-3 font-medium">Statuts</th>
                  <th className="px-4 py-3 font-medium">Photos</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apartment) => {
                  const images = imageMap.get(apartment.id) ?? [];
                  const owner = apartment.owner_id ? ownerMap.get(apartment.owner_id) : null;
                  const cover = apartment.image_url || images[0]?.image_url || images[0]?.url || fallbackImages.apartment.url;
                  return (
                    <tr key={apartment.id} className="border-t align-middle">
                      <td className="px-4 py-3">
                        <div className="relative h-14 w-20 overflow-hidden rounded-sm bg-surface">
                          <Image src={cover} alt={apartment.public_name} fill sizes="80px" className="object-cover" unoptimized={Boolean(cover)} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/apartments/${apartment.id}`} className="font-medium hover:text-gold hover:underline">{apartment.public_name}</Link>
                        <p className="mt-1 text-xs text-muted-foreground">{apartment.internal_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {owner ? (
                          <Link href={`/dashboard/owners/${owner.id}`} className="text-xs text-gold hover:underline">{owner.full_name}</Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non rattache</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{apartment.district}</td>
                      <td className="px-4 py-3">{apartment.capacity} pers. · {apartment.bedrooms} ch.</td>
                      <td className="px-4 py-3">{formatCurrency(apartment.price_per_night ?? apartment.price_from)}</td>
                      <td className="px-4 py-3"><ApartmentStatusBadges managementStatus={apartment.management_status} publicStatus={apartment.public_status} contractStatus={apartment.contract_status} /></td>
                      <td className="px-4 py-3"><Badge tone={images.length > 0 ? "success" : "warning"}>{images.length}/6</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/apartments/${apartment.id}`} className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold"><PenLine className="h-4 w-4" /></Link>
                          <Link href={`/dashboard/apartments/${apartment.id}#modifier`} className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold"><Camera className="h-4 w-4" /></Link>
                          <Link href={`/dashboard/documents/new?apartmentId=${apartment.id}`} className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold"><FileText className="h-4 w-4" /></Link>
                          <Link href={`/dashboard/expenses/new?apartmentId=${apartment.id}`} className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold"><Receipt className="h-4 w-4" /></Link>
                          {apartment.public_status === "published" && <Link href={`/apartments/${apartment.slug}`} className="rounded-sm border border-border p-2 text-muted-foreground hover:text-gold">Site</Link>}
                          <form action={deleteApartmentAction.bind(null, apartment.id)}>
                            <button type="submit" className="rounded-sm border border-border p-2 text-xs text-red-400 hover:text-red-300">Suppr.</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
