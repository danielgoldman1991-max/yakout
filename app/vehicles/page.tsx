import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bus, Car, Check, MessageCircle, Shield, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { getPublicVehicles, type PublicVehicle } from "@/lib/data/public-vehicles";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Types de vehicules disponibles | Transport prive Yakout",
  description: "Types de vehicules disponibles dans le cadre du service de transport prive Yakout : berline confort, SUV premium, van touristique et vehicule partenaire selon disponibilite.",
};

const categories = [
  { icon: Car, title: "Berline confort", desc: "Ideale pour transferts simples, rendez-vous, trajets courts et deplacements en ville." },
  { icon: Shield, title: "SUV / 4x4 premium", desc: "Ideal pour familles, circuits, Agafay, Ourika et trajets confortables autour de Marrakech." },
  { icon: Bus, title: "Van touristique", desc: "Ideal pour groupes, familles nombreuses, bagages et circuits prives type Mercedes Vito ou equivalent." },
  { icon: Users, title: "Vehicule familial", desc: "Solution pratique pour sejours avec enfants, bagages et horaires multiples." },
];

export default async function VehiclesPage() {
  const vehicles = await getPublicVehicles();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Types de vehicules disponibles</p>
                <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                  Des categories de vehicules pour votre <span className="text-gold">transport prive</span>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                  Nos vehicules sont proposes dans le cadre d&apos;un service de transport prive avec chauffeur. Pour une demande simple, utilisez la page Transport prive.
                </p>
                <div className="mt-7 rounded-sm border border-gold/20 bg-gold/5 p-5 text-sm leading-7 text-muted-foreground">
                  Le client ne choisit pas d&apos;abord une voiture. Il indique son besoin de transport, puis Yakout propose la solution adaptee selon disponibilite, passagers, bagages et confort souhaite.
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=transport" variant="primary">
                    Demander un transport prive <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <PremiumButton href="/transport" variant="outline">
                    Voir Transport prive
                  </PremiumButton>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image src={fallbackImages.vehicle.url} alt="Vehicule avec chauffeur adapte au besoin client" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" priority />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader label="Categories" title="Une categorie adaptee a chaque besoin" description="Berline confort, SUV premium, 4x4 de luxe, van touristique type Mercedes Vito ou vehicule partenaire equivalent selon disponibilite." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6">
                  <Icon className="h-5 w-5 text-gold" />
                  <h3 className="mt-4 font-display text-sm text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {vehicles.length > 0 && (
          <section className="border-b border-border bg-surface">
            <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
              <SectionHeader label="Disponibilites" title="Exemples de vehicules et partenaires" description="Ces vehicules illustrent les solutions possibles. Le modele exact n'est pas garanti et depend de la disponibilite." />
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <Check className="mx-auto h-8 w-8 text-gold" />
              <h2 className="mt-5 font-display text-2xl text-foreground md:text-3xl">Besoin d&apos;un transport prive ?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Indiquez trajet, horaires, passagers et bagages. Yakout vous proposera le vehicule avec chauffeur le plus adapte.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=transport" variant="primary">
                Demander un transport prive <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link href={buildWhatsAppUrl("Bonjour Yakout, je souhaite organiser un transport prive a Marrakech.")} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: PublicVehicle }) {
  const safeCapacity = vehicle.capacity ? `${vehicle.capacity} places` : "Capacite sur demande";
  const safePrice = vehicle.price_from ? `${formatCurrency(vehicle.price_from)} / trajet` : "Prix sur demande";
  const imageSrc = vehicle.cover_image || vehicle.image_url || fallbackImages.vehicle.url;
  const imageAlt = vehicle.cover_alt || vehicle.image_alt_text || `Categorie de vehicule ${vehicle.display_name} pour transport prive`;

  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={imageSrc} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">{vehicle.display_name}</h3>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gold" />{safeCapacity}</span>
          {vehicle.with_driver && <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-gold" />Avec chauffeur</span>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-lg font-light text-gold">{safePrice}</p>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition group-hover:text-gold-light">
            Details <ArrowRight className="ml-1 inline h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
