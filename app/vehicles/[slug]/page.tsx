import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Car, Check, Clock, MapPin, MessageCircle, Shield, Star, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { LeadForm } from "@/components/public/lead-form";
import { getPublicVehicleBySlug } from "@/lib/data/public-vehicles";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);
  if (!vehicle) return { title: "Véhicule introuvable" };

  return {
    title: `${vehicle.display_name} avec chauffeur à Marrakech | Yakout`,
    description: `Demandez ${vehicle.display_name} à Marrakech. ${vehicle.capacity} places, à partir de ${formatCurrency(vehicle.price_from)}/trajet. Chauffeur professionnel, confort et ponctualité.`,
    openGraph: {
      title: `${vehicle.display_name} | Yakout Marrakech`,
      description: `Véhicule avec chauffeur à Marrakech. ${vehicle.capacity} places, à partir de ${formatCurrency(vehicle.price_from)}/trajet.`,
      images: vehicle.cover_image ? [{ url: vehicle.cover_image }] : undefined,
    },
  };
}

const features = (capacity: number, luggage?: number | null) => [
  { label: "Capacité", value: `${capacity} places` },
  { label: "Bagages", value: luggage ? `${luggage} bagages` : "Sur demande" },
  { label: "Chauffeur", value: "Professionnel inclus" },
  { label: "Service", value: "Transport privé" },
];

const useCases = [
  { icon: MapPin, title: "Transfert aéroport", desc: "Accueil à Marrakech Menara et prise en charge jusqu'à votre hébergement." },
  { icon: Star, title: "Excursions", desc: "Agafay, Ourika, Essaouira et les sites autour de Marrakech selon votre programme." },
  { icon: Clock, title: "Mise à disposition", desc: "Chauffeur ponctuel, demi-journée ou journée complète selon le besoin." },
  { icon: Car, title: "Trajets privés", desc: "Déplacements en ville pour rendez-vous, shopping, restaurants ou événements." },
];

const reassurances = [
  { icon: Shield, title: "Coordination claire", desc: "Votre demande est qualifiée avant confirmation du véhicule adapté." },
  { icon: Star, title: "Confort adapté", desc: "Catégorie proposée selon passagers, bagages, trajet et disponibilité réelle." },
  { icon: MapPin, title: "Chauffeur local", desc: "Conducteur connaissant Marrakech, ses quartiers et ses environs." },
  { icon: Check, title: "Suivi Yakout", desc: "Confirmation, horaires et détails pratiques centralisés avant le trajet." },
];

export default async function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);
  if (!vehicle) notFound();

  const safeCapacity = vehicle.capacity ? `${vehicle.capacity} places` : "Capacité sur demande";
  const imageSrc = vehicle.cover_image || vehicle.image_url || fallbackImages.vehicle.url;
  const imageAlt = vehicle.cover_alt || vehicle.image_alt_text || fallbackImages.vehicle.alt;
  const safePrice = vehicle.price_from ? formatCurrency(vehicle.price_from) : "sur estimation";
  const whatsappMsg = `Bonjour Yakout, je souhaite organiser un transport privé à Marrakech. Mon besoin pourrait correspondre à ${vehicle.display_name}.`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="relative overflow-hidden bg-surface">
          <div className="relative aspect-[4/5] max-h-[70vh] min-h-[320px] sm:aspect-[16/10] md:min-h-[460px] lg:aspect-[21/9]">
            <Image src={imageSrc} alt={imageAlt} fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="container mx-auto px-6 pb-8 md:px-12 md:pb-12">
                <Link href="/vehicles" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/75 transition hover:text-gold">
                  <ArrowRight className="h-3 w-3 rotate-180" />
                  Retour aux véhicules
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-gold">
                  <span className="rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">{vehicle.category ?? "Transport privé"}</span>
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
                <h1 className="mt-3 font-display text-[clamp(1.6rem,4vw,3.2rem)] font-semibold leading-[1.06] text-white">
                  {vehicle.display_name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
            <div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
                {features(vehicle.capacity || 4, vehicle.luggage_capacity).map(({ label, value }) => (
                  <div key={label} className="bg-card px-5 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-display text-base text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-14">
                <SectionHeader
                  label="Présentation"
                  title="Mobilité premium à Marrakech"
                  description={`${vehicle.display_name} — une solution proposée selon votre trajet, vos passagers, vos bagages et la disponibilité réelle.`}
                />
                <div className="mt-6 max-w-prose space-y-5 text-[15px] leading-8 text-muted-foreground">
                  <p>
                    {vehicle.description || vehicle.short_description || `${vehicle.display_name} vous offre un service de transport privé confortable pour vos déplacements à Marrakech.`}
                  </p>
                  <p>
                    Chaque demande est vérifiée par Yakout afin de proposer une catégorie adaptée, sans promettre un modèle exact lorsque la disponibilité dépend d’un partenaire.
                  </p>
                </div>
              </div>

              <div className="mt-14">
                <SectionHeader label="Usages recommandés" title="Adapté à vos déplacements" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {useCases.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-sm border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                        <Icon className="h-4 w-4 text-gold" />
                      </div>
                      <h2 className="mt-4 font-display text-sm text-foreground">{title}</h2>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-14">
                <SectionHeader label="Pourquoi nous choisir" title="Voyagez avec un cadre clair" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {reassurances.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 rounded-sm border border-border bg-card p-5 transition-all duration-300 hover:border-gold/20 hover:shadow-elevation-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                        <Icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground">{title}</h2>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-sm border border-border bg-card shadow-elevation-1">
                <div className="border-b border-border px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">À partir de</p>
                  <p className="mt-2 font-display text-3xl text-gold">
                    {safePrice}
                    <span className="text-sm text-muted-foreground"> / trajet</span>
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm font-medium text-foreground">Demande de transport</p>
                  <p className="mt-1 text-xs text-muted-foreground">Remplissez ce formulaire et nous vous répondons rapidement.</p>
                  <div className="mt-4">
                    <LeadForm requestType="transport" source="vehicle_detail" relatedType="vehicle" relatedSlug={vehicle.slug} entityName={vehicle.display_name} />
                  </div>
                  <div className="mt-4">
                    <Link
                      href={buildWhatsAppUrl(whatsappMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                    >
                      <MessageCircle className="h-4 w-4 text-gold/70" />
                      Réserver par WhatsApp
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <section className="border-t border-border bg-surface">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">Prêt à organiser votre transport ?</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour réserver votre trajet ou construire un itinéraire sur mesure.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href={`/contact?type=transport&vehicle=${vehicle.slug}`} variant="primary">
                Demander un transport privé <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl(whatsappMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-xs font-semibold uppercase tracking-[0.1em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
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
