import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Car, HelpCircle, Shield, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { getPublicTransportVehicles, type PublicVehicle } from "@/lib/data/public-vehicles";

export async function TransportVehiclesSection() {
  const vehicles = await getPublicTransportVehicles();

  if (vehicles.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
        <SectionHeader
          label="Nos vehicules avec chauffeur"
          title="Des vehicules adaptes a chaque deplacement"
          description="Selon votre trajet, le nombre de passagers et vos bagages, Yakout vous propose le vehicule le plus adapte : berline confort, SUV premium, 4x4 de luxe ou van touristique type Mercedes Vito selon disponibilite."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleShowcaseCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-sm border border-gold/20 bg-gold/5 p-8 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-gold" />
          <h3 className="mt-4 font-display text-xl text-foreground">Vous ne savez pas quel vehicule choisir ?</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Indiquez simplement votre trajet, le nombre de passagers et vos bagages. Yakout vous proposera la solution
            la plus adaptee selon disponibilite : berline, SUV premium, 4x4 de luxe ou van touristique.
          </p>
          <div className="mt-6">
            <PremiumButton href="/contact?type=transport" variant="primary">
              Me conseiller un vehicule <ArrowRight className="h-4 w-4" />
            </PremiumButton>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold/60 transition hover:text-gold"
          >
            Voir tous les types de vehicules <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function VehicleShowcaseCard({ vehicle }: { vehicle: PublicVehicle }) {
  const safePrice = vehicle.price_from > 0 ? `${formatCurrency(vehicle.price_from)}` : "Sur demande";
  const categoryLabel = getCategoryLabel(vehicle.category);

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={vehicle.cover_image || fallbackImages.vehicle.url}
          alt={vehicle.cover_alt || `Vehicule ${vehicle.display_name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {categoryLabel && (
          <div className="absolute left-3 top-3 rounded-sm bg-background/82 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold backdrop-blur-sm">
            {categoryLabel}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
          {vehicle.display_name}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-gold" />
            {vehicle.capacity} places
          </span>
          {vehicle.luggage_capacity && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-gold" />
              {vehicle.luggage_capacity} bagages
            </span>
          )}
          {vehicle.with_driver && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 shrink-0 text-gold" />
              Avec chauffeur
            </span>
          )}
        </div>

        {vehicle.short_description && (
          <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-2">
            {vehicle.short_description}
          </p>
        )}

        <div className="mt-auto border-t border-border pt-4">
          <p className="text-lg font-light text-gold">{safePrice}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/contact?type=transport&vehicle=${vehicle.slug}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm bg-gold px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-foreground transition hover:bg-gold/90"
          >
            Demander ce vehicule <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
          <Link
            href={`/vehicles/${vehicle.slug}`}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-border px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground transition hover:border-gold/20 hover:bg-gold/5"
          >
            Voir la fiche <Shield className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function getCategoryLabel(category: string | null): string | null {
  if (!category) return null;
  const labels: Record<string, string> = {
    berline: "Berline confort",
    suv: "SUV / 4x4 premium",
    "4x4": "SUV / 4x4 premium",
    van: "Van touristique",
    minivan: "Van touristique",
    familial: "Vehicule familial",
    premium: "Vehicule premium",
    partenaire: "Vehicule partenaire",
  };
  return labels[category.toLowerCase()] ?? null;
}
