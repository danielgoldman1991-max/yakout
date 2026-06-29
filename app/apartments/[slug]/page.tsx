import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Users, MessageCircle, Check, Home, Star, Shield } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { LeadForm } from "@/components/public/lead-form";
import { getApartmentBySlug } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) return { title: "Appartement introuvable" };
  return {
    title: apartment.meta_title || `${apartment.public_name} - Appartement à ${apartment.district}, Marrakech | Yakout`,
    description: apartment.meta_description || `Réservez l'appartement ${apartment.public_name} à ${apartment.district}, Marrakech. ${apartment.capacity} personnes, ${apartment.bedrooms} chambre(s). À partir de ${formatCurrency(apartment.price_from)}/nuit. Conciergerie premium Yakout.`,
    openGraph: {
      title: `${apartment.public_name} - ${apartment.district} | Yakout Marrakech`,
      description: apartment.meta_description || `Appartement premium à ${apartment.district}, Marrakech. ${apartment.capacity} personnes, à partir de ${formatCurrency(apartment.price_from)}/nuit.`,
      images: apartment.image_url ? [{ url: apartment.image_url }] : undefined,
    },
  };
}

const defaultPerks = [
  "Service ménage inclus entre chaque séjour",
  "Check-in flexible et autonome possible",
  "Équipement complet et linge de maison fourni",
  "WiFi haut débit et climatisation",
  "Support Yakout disponible 7j/7",
  "Arrivée accompagnée par notre équipe",
];

export default async function ApartmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();

  const safeDistrict = apartment.district || "Quartier à confirmer";
  const safeCapacity = apartment.capacity ? `${apartment.capacity} personnes` : "Capacité sur demande";
  const safeBedrooms = apartment.bedrooms ? `${apartment.bedrooms} chambre${apartment.bedrooms > 1 ? "s" : ""}` : "Studio";
  const safeBathrooms = apartment.bathrooms ? `${apartment.bathrooms} salle${apartment.bathrooms > 1 ? "s" : ""} de bain` : "Salle de bain";
  const imageSrc = apartment.image_url || fallbackImages.apartment.url;
  const imageAlt = apartment.image_alt_text || (apartment.image_url ? `Appartement ${apartment.public_name} à ${safeDistrict}, Marrakech` : fallbackImages.apartment.alt);
  const whatsappMsg = `Bonjour Yakout, je souhaite des informations sur l'appartement ${apartment.public_name} à ${safeDistrict}.`;
  const descriptionParagraphs = apartment.detailed_description
    ? apartment.detailed_description.split(/\n{1,}/).map((item) => item.trim()).filter(Boolean)
    : [];
  const apartmentPerks = apartment.amenities && apartment.amenities.length > 0 ? apartment.amenities : defaultPerks;
  const whyChoose = [
    {
      icon: Home,
      title: "Confort et équipement",
      desc: apartment.short_description || `${safeBedrooms}, ${safeBathrooms}, capacité ${safeCapacity.toLowerCase()}.`,
    },
    {
      icon: MapPin,
      title: "Emplacement privilégié",
      desc: `Situé à ${safeDistrict}, avec les informations de quartier modifiables depuis le dashboard.`,
    },
    {
      icon: Shield,
      title: "Description du bien",
      desc: descriptionParagraphs[0] || "Complétez la description longue depuis le dashboard pour enrichir cette section.",
    },
    {
      icon: Star,
      title: "Équipements",
      desc: apartmentPerks.slice(0, 3).join(", "),
    },
  ];

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
              unoptimized={Boolean(apartment.image_url)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="container mx-auto px-6 pb-8 md:px-12 md:pb-12">
                <Link
                  href="/apartments"
                  className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-gold"
                >
                  <ArrowRight className="h-3 w-3 rotate-180" />
                  Retour aux appartements
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {safeDistrict}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                    <Users className="h-3.5 w-3.5" />
                    {safeCapacity}
                  </span>
                  {apartment.bedrooms > 0 && (
                    <span className="rounded-sm bg-background/60 px-2 py-1 backdrop-blur-sm">
                      {safeBedrooms}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-display text-[clamp(1.6rem,4vw,3.2rem)] font-semibold leading-[1.06] tracking-tight text-white">
                  {apartment.public_name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Contenu principal ─── */}
        <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
            {/* Colonne principale */}
            <div>
              {/* Infos clés */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
                {[
                  { label: "Quartier", value: safeDistrict },
                  { label: "Capacité", value: safeCapacity },
                  { label: "Chambres", value: safeBedrooms },
                  { label: "Salles de bain", value: safeBathrooms },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card px-5 py-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-display text-base text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description éditoriale */}
              <div className="mt-14">
                <SectionHeader
                  title={apartment.public_name}
                  description={apartment.short_description || "Cet appartement a été sélectionné pour son emplacement, son confort et sa qualité d'accueil."}
                />
                <div className="mt-6 max-w-prose space-y-5 text-[15px] leading-8 text-muted-foreground">
                  {descriptionParagraphs.length > 0 ? (
                    descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  ) : (
                    <>
                      <p>
                        Situé dans le quartier prisé de <strong>{safeDistrict}</strong>, cet appartement
                        vous offre un cadre idéal pour profiter pleinement de Marrakech.
                      </p>
                      <p>
                        Ajoutez une description longue depuis le dashboard pour personnaliser ce contenu.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Équipements et services */}
              <div className="mt-14">
                <SectionHeader
                  label="Équipements"
                  title="Tout le confort pour votre séjour"
                />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {apartmentPerks.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 transition-all duration-200 hover:border-gold/15 hover:shadow-elevation-1">
                      <Check className="h-4 w-4 shrink-0 text-gold" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pourquoi choisir cet appartement */}
              <div className="mt-14">
                <SectionHeader
                  label="Pourquoi cet appartement"
                  title="Confort, emplacement et accompagnement"
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {whyChoose.map(({ icon: Icon, title, desc }) => (
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
            </div>

            {/* Sidebar sticky */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-sm border border-border bg-card shadow-elevation-1">
                <div className="border-b border-border px-6 py-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    À partir de
                  </p>
                  <p className="mt-2 font-display text-3xl text-gold">
                    {formatCurrency(apartment.price_from)}
                    <span className="text-sm text-muted-foreground"> / nuit</span>
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm font-medium text-foreground">Demande de réservation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remplissez ce formulaire et nous vous répondons sous 24h.
                  </p>
                  <div className="mt-4">
                    <LeadForm
                      requestType="reservation"
                      source="apartment_detail"
                      relatedType="apartment"
                      relatedSlug={apartment.slug}
                      messagePlaceholder={`Bonjour Yakout, je souhaite réserver l'appartement ${apartment.public_name}. Pouvez-vous me contacter ?`}
                    />
                  </div>
                  <div className="mt-4">
                    <Link
                      href={buildWhatsAppUrl(whatsappMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-gold/70" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">Disponibilité par WhatsApp</span>
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
              Vous souhaitez réserver cet appartement&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour vérifier les disponibilités et organiser votre arrivée à Marrakech.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=reservation" variant="primary">
                Demander une disponibilité <ArrowRight className="h-4 w-4" />
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
