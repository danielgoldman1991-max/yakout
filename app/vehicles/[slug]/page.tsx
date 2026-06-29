import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Users, Car, MessageCircle, Check, Shield, Clock, MapPin, Star } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { LeadForm } from "@/components/public/lead-form";
import { getVehicleBySlug } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Véhicule introuvable" };
  return {
    title: `${vehicle.public_name} - ${vehicle.brand} ${vehicle.model} avec chauffeur à Marrakech | Yakout`,
    description: `Réservez ${vehicle.public_name} (${vehicle.brand} ${vehicle.model}) à Marrakech. ${vehicle.capacity} places, à partir de ${formatCurrency(vehicle.price_from)}/trajet. Chauffeur professionnel, confort et ponctualité.`,
    openGraph: {
      title: `${vehicle.public_name} - ${vehicle.brand} ${vehicle.model} | Yakout Marrakech`,
      description: `Véhicule ${vehicle.brand} ${vehicle.model} à Marrakech. ${vehicle.capacity} places, à partir de ${formatCurrency(vehicle.price_from)}/trajet.`,
      images: vehicle.image_url ? [{ url: vehicle.image_url }] : undefined,
    },
  };
}

const features = (capacity: number) => [
  { label: "Capacité", value: `${capacity} places` },
  { label: "Climatisation", value: "Oui" },
  { label: "Chauffeur", value: "Professionnel inclus" },
  { label: "Wifi à bord", value: "Oui" },
];

const useCases = [
  { icon: MapPin, title: "Transfert aéroport", desc: "Accueil à Marrakech Menara avec panneau nominatif et prise en charge jusqu'à votre hébergement." },
  { icon: Star, title: "Excursions", desc: "Explorez Agafay, Ourika, Essaouira et les plus beaux sites autour de Marrakech." },
  { icon: Clock, title: "Mise à disposition", desc: "Le véhicule et le chauffeur à votre service pour la demi-journée ou la journée complète." },
  { icon: Car, title: "Trajets privés", desc: "Déplacements en ville en toute discrétion pour rendez-vous, shopping ou dîners." },
];

const reassurances = [
  { icon: Shield, title: "Ponctualité garantie", desc: "Suivi en temps réel et communication avant chaque prise en charge." },
  { icon: Star, title: "Confort premium", desc: "Véhicule climatisé, spacieux, avec wifi à bord et bouteille d'eau offerte." },
  { icon: MapPin, title: "Chauffeur local", desc: "Conducteur connaissant parfaitement Marrakech, ses quartiers et ses environs." },
  { icon: Check, title: "Service organisé", desc: "Réservation simple, confirmation immédiate et suivi dédié par notre équipe." },
];

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const safeBrand = vehicle.brand || "";
  const safeModel = vehicle.model || "";
  const safeCapacity = vehicle.capacity ? `${vehicle.capacity} places` : "Capacité sur demande";
  const imageSrc = vehicle.image_url || fallbackImages.vehicle.url;
  const imageAlt = vehicle.image_url ? `Véhicule ${vehicle.public_name} avec chauffeur à Marrakech` : fallbackImages.vehicle.alt;
  const whatsappMsg = `Bonjour Yakout, je souhaite réserver ${vehicle.public_name}${safeBrand ? ` (${safeBrand} ${safeModel})` : ""} à Marrakech.`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero image immersive ─── */}
        <section className="relative overflow-hidden bg-surface">
          <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9] max-h-[70vh] min-h-[320px] md:min-h-[460px]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="container mx-auto px-6 pb-8 md:px-12 md:pb-12">
                <Link
                  href="/vehicles"
                  className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-gold"
                >
                  <ArrowRight className="h-3 w-3 rotate-180" />
                  Retour aux véhicules
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                  <span className="rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                    {safeBrand} {safeModel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                    <Users className="h-3.5 w-3.5" />
                    {safeCapacity}
                  </span>
                  {vehicle.with_driver && (
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                      <Car className="h-3.5 w-3.5" />
                      Avec chauffeur
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-display text-[clamp(1.6rem,4vw,3.2rem)] font-semibold leading-[1.06] tracking-tight text-white">
                  {vehicle.public_name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Contenu ─── */}
        <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
            {/* Colonne principale */}
            <div>
              {/* Caractéristiques */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
                {features(vehicle.capacity || 4).map(({ label, value }) => (
                  <div key={label} className="bg-card px-5 py-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-display text-base text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mt-14">
                <SectionHeader
                  label="Présentation"
                  title="Mobilité premium à Marrakech"
                  description={`${vehicle.public_name}${safeBrand ? ` — ${safeBrand} ${safeModel}` : ""} — un véhicule sélectionné pour votre confort et votre sécurité.`}
                />
                <div className="mt-6 max-w-prose space-y-5 text-[15px] leading-8 text-muted-foreground">
                  <p>
                    {vehicle.with_driver
                      ? `${safeBrand ? `Le ${safeBrand} ${safeModel}` : vehicle.public_name} vous offre un espace généreux et un confort optimal pour tous vos déplacements à Marrakech. Accompagné d'un chauffeur professionnel, ce service de mobilité premium est idéal pour les transferts aéroport, les excursions et les trajets privés.`
                      : `${safeBrand ? `Le ${safeBrand} ${safeModel}` : vehicle.public_name} est disponible à la location avec ou sans chauffeur pour répondre à tous vos besoins de mobilité à Marrakech.`}
                  </p>
                  <p>
                    Chaque trajet est pensé pour vous offrir une expérience fluide et agréable&thinsp;:
                    véhicule climatisé, wifi à bord, ponctualité garantie et service personnalisé.
                  </p>
                </div>
              </div>

              {/* Usages */}
              <div className="mt-14">
                <SectionHeader
                  label="Usages recommandés"
                  title="Adapté à tous vos déplacements"
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

              {/* Réassurance */}
              <div className="mt-14">
                <SectionHeader
                  label="Pourquoi nous choisir"
                  title="Voyagez en toute sérénité"
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {reassurances.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 rounded-sm border border-border bg-card p-5 transition-all duration-300 hover:border-gold/20 hover:shadow-elevation-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                        <Icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{title}</h3>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar sticky */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-sm border border-border bg-card shadow-elevation-1">
                <div className="border-b border-border px-6 py-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    À partir de
                  </p>
                  <p className="mt-2 font-display text-3xl text-gold">
                    {formatCurrency(vehicle.price_from)}
                    <span className="text-sm text-muted-foreground"> / trajet</span>
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm font-medium text-foreground">Demande de réservation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remplissez ce formulaire et nous vous répondons sous 24h.
                  </p>
                  <div className="mt-4">
                    <LeadForm
                      requestType="vehicule"
                      source="vehicle_detail"
                      relatedType="vehicle"
                      relatedSlug={vehicle.slug}
                      messagePlaceholder={`Bonjour Yakout, je souhaite réserver ${vehicle.public_name} avec chauffeur. Pouvez-vous me contacter ?`}
                    />
                  </div>
                  <div className="mt-4">
                    <Link
                      href={buildWhatsAppUrl(whatsappMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-gold/70" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">Réserver par WhatsApp</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CTA final ─── */}
        <section className="border-t border-border bg-surface">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Prêt à réserver ce véhicule&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour réserver votre trajet ou pour construire un itinéraire sur mesure.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=vehicule" variant="primary">
                Réserver maintenant <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl(whatsappMsg)}
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
