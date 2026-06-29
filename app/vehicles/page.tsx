import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Users, Car, Shield, Clock, MapPin, Star, Check, MessageCircle, Plane } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { getPublishedVehicles } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { Vehicle } from "@/types/business";

export const metadata: Metadata = {
  title: "Véhicules avec chauffeur à Marrakech",
  description: "Skoda Kodiaq avec chauffeur et véhicules partenaires à Marrakech. Transferts aéroport, excursions, trajets privés et mise à disposition. Confort, sécurité et ponctualité.",
};

const useCases = [
  { icon: Plane, title: "Transfert aéroport Marrakech Menara", desc: "Accueil à l'arrivée, aide avec les bagages et trajet organisé vers votre appartement, hôtel ou riad." },
  { icon: MapPin, title: "Trajets privés en ville", desc: "Déplacements confortables pour restaurants, rendez-vous, shopping, sorties ou visites." },
  { icon: Star, title: "Excursions autour de Marrakech", desc: "Agafay, Ourika, Palmeraie ou autres destinations sur demande avec chauffeur." },
  { icon: Clock, title: "Mise à disposition", desc: "Chauffeur disponible sur une durée définie pour accompagner votre journée." },
];

const whyPoints = [
  { icon: Car, title: "Chauffeurs locaux", desc: "Conducteurs professionnels connaissant parfaitement Marrakech et ses environs." },
  { icon: Check, title: "Organisation simple", desc: "Réservation rapide, confirmation immédiate, suivi dédié par notre équipe." },
  { icon: Shield, title: "Véhicules adaptés", desc: "Du Skoda Kodiaq au Mercedes Sprinter, le véhicule adapté à votre groupe et votre trajet." },
  { icon: MessageCircle, title: "Réponse rapide", desc: "Contactez-nous par WhatsApp pour une réponse sous quelques minutes." },
];

const skodaFeatures = [
  "Jusqu'à 6 places",
  "Chauffeur privé",
  "Transfert aéroport",
  "Trajets privés",
  "Excursions sur demande",
];

export default async function VehiclesPage() {
  const vehicles = await getPublishedVehicles();
  const skoda = vehicles.find((v) => v.slug === "skoda-kodiaq-executive");
  const partnerVehicles = vehicles.filter((v) => v.slug !== "skoda-kodiaq-executive");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mobilité premium</p>
                <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                  Véhicules avec chauffeur <span className="text-gold">à Marrakech</span>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                  Yakout organise vos transferts, trajets privés et déplacements sur mesure à Marrakech
                  avec chauffeur privé, Skoda Kodiaq et véhicules partenaires selon vos besoins.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=vehicule" variant="primary">
                    Réserver un chauffeur <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, je souhaite réserver un véhicule avec chauffeur à Marrakech.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Demander sur WhatsApp
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={skoda?.image_url || fallbackImages.vehicle.url}
                  alt="Skoda Kodiaq avec chauffeur à Marrakech"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-4 left-4 rounded-sm bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-sm">
                  Skoda Kodiaq — 6 places
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Skoda Kodiaq principal ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm order-last lg:order-first">
                <Image
                  src={skoda?.image_url || fallbackImages.vehicle.url}
                  alt="Skoda Kodiaq avec chauffeur privé à Marrakech"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <SectionHeader
                  label="Notre véhicule principal"
                  title="Skoda Kodiaq avec chauffeur privé"
                  description="Le véhicule principal Yakout pour vos transferts, trajets privés, familles et déplacements premium à Marrakech."
                />
                <div className="mt-8 grid gap-2.5">
                  {skodaFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                        <Check className="h-3 w-3 text-gold" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=vehicule" variant="primary">
                    Réserver le Skoda Kodiaq <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, je souhaite réserver le Skoda Kodiaq avec chauffeur à Marrakech.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Usages transport ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Vos déplacements"
              title="Vos déplacements à Marrakech, organisés avec soin"
              description="Que vous arriviez à l'aéroport, partie en excursion ou ayez besoin d'un chauffeur pour la journée."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-sm text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Véhicules partenaires ─── */}
        {vehicles.length > 0 && (
          <section className="border-b border-border bg-background">
            <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
              <SectionHeader
                label="Véhicules partenaires"
                title="Véhicules partenaires sur demande"
                description="En complément du Skoda Kodiaq, Yakout peut organiser des véhicules adaptés à votre groupe, votre confort et votre type de trajet."
              />
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {partnerVehicles.length > 0 ? partnerVehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                )) : vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Pourquoi choisir Yakout ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Pourquoi Yakout"
              title="Pourquoi réserver votre chauffeur avec Yakout ?"
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {whyPoints.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-sm text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA final ─── */}
        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Besoin d&apos;un chauffeur à Marrakech&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Indiquez votre trajet, votre horaire et le nombre de passagers. Yakout vous oriente vers le véhicule adapté.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=vehicule" variant="primary">
                Réserver un chauffeur <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl("Bonjour Yakout, je souhaite réserver un chauffeur privé à Marrakech.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Contacter sur WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const safeCapacity = vehicle.capacity ? `${vehicle.capacity} places` : "Capacité sur demande";
  const safePrice = vehicle.price_from ? `${formatCurrency(vehicle.price_from)} / trajet` : "Prix sur demande";

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      className="group overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={vehicle.image_url || fallbackImages.vehicle.url}
          alt={`Véhicule ${vehicle.public_name} avec chauffeur à Marrakech`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-3 left-3 rounded-sm bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {vehicle.brand} {vehicle.model}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
          {vehicle.public_name}
        </h3>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gold" />
            {safeCapacity}
          </span>
          {vehicle.with_driver && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-gold" />
              Avec chauffeur
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-lg font-light text-gold">{safePrice}</p>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition group-hover:text-gold-light">
            Détails <ArrowRight className="ml-1 inline h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
