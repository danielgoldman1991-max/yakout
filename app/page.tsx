import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Heart, Luggage, Paintbrush, TrendingUp, Home, Users, Sparkles, Shield, Globe, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumHeroV2 } from "@/components/public/premium-hero-v2";
import { ServiceShowcaseV2 } from "@/components/public/service-showcase-v2";
import { PropertySectionV2 } from "@/components/public/property-section-v2";
import { TransferSectionV2 } from "@/components/public/transfer-section-v2";
import { TrustSectionV2 } from "@/components/public/trust-section-v2";
import { MethodSectionV2 } from "@/components/public/method-section-v2";
import { FinalCtaV2 } from "@/components/public/final-cta-v2";
import { getPublishedApartments, getPublishedVehicles, getServices } from "@/lib/data";
import { site } from "@/lib/constants/site";
import { getBaseUrl } from "@/lib/utils/url";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export const metadata: Metadata = {
  title: site.metaTitle,
  description: site.metaDescription,
  openGraph: {
    title: site.metaTitle,
    description: site.metaDescription,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: site.companyName,
  description: site.metaDescription,
  areaServed: site.city,
  telephone: site.phoneDisplay,
  email: site.email,
  url: getBaseUrl(),
  image: site.logo,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressCountry: "MA",
  },
};

const ownerBenefits = [
  { icon: Home, title: "Mise en valeur du bien", desc: "Photos professionnelles, description optimisée et visibilité maximale." },
  { icon: Luggage, title: "Accueil voyageurs", desc: "Check-in, check-out, remise des clés et assistance tout au long du séjour." },
  { icon: Paintbrush, title: "Ménage et maintenance", desc: "Ménage professionnel après chaque départ et suivi technique du bien." },
  { icon: TrendingUp, title: "Suivi des revenus", desc: "Reporting clair, optimisation tarifaire et virement mensuel." },
];

const coverageTravelers = [
  { icon: Home, title: "Séjour", desc: "Recherche et réservation d'appartement premium." },
  { icon: TrendingUp, title: "Transfert", desc: "Prise en charge aéroport et trajets privés." },
  { icon: Heart, title: "Chauffeur", desc: "Chauffeur privé à la demande ou à la journée." },
  { icon: Sparkles, title: "Services touristiques", desc: "Excursions, activités et conseils personnalisés." },
  { icon: MessageCircle, title: "Assistance WhatsApp", desc: "Réponse en temps réel pendant tout votre séjour." },
];

const coverageOwners = [
  { icon: Globe, title: "Mise en ligne du bien", desc: "Annonce optimisée sur notre site et nos partenaires." },
  { icon: Users, title: "Accueil voyageurs", desc: "Gestion complète des arrivées et départs." },
  { icon: Sparkles, title: "Ménage", desc: "Nettoyage professionnel entre chaque séjour." },
  { icon: Shield, title: "Maintenance", desc: "Suivi technique et interventions rapides." },
  { icon: TrendingUp, title: "Suivi activité", desc: "Tableau de bord avec vos revenus en temps réel." },
  { icon: FileText, title: "Reporting", desc: "Rapport mensuel détaillé et virement automatique." },
];

function FileText(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  );
}

export default async function HomePage() {
  const [publishedApartments, publishedVehicles, services] = await Promise.all([
    getPublishedApartments(), getPublishedVehicles(), getServices(),
  ]);
  const featuredApartments = publishedApartments.filter((a) => a.is_featured).length > 0
    ? publishedApartments.filter((a) => a.is_featured).slice(0, 3)
    : publishedApartments.slice(0, 3);
  const skodaVehicle = publishedVehicles[0];

  return (
    <div className="min-h-screen bg-background">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SiteHeader />
        <WhatsAppFloatingButton />

        <main className="pt-[80px]">
        {/* ─── Hero V2 ─── */}
        <PremiumHeroV2 />

        {/* ─── Services V2 ─── */}
        <ServiceShowcaseV2 services={services} />

        {/* ─── Propriétaire —── */}
        <section className="border-b border-border bg-surface-light">
          <div className="container mx-auto px-6 py-24 md:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="ruby-diamond" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Propriétaires</p>
                  <span className="gold-sep" />
                </div>
                <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
                  Vous êtes propriétaire à Marrakech ?
                </h2>
                <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
                  Confiez votre appartement à Yakout pour une gestion plus professionnelle, plus fluide et mieux suivie.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {ownerBenefits.map((b) => (
                    <div key={b.title} className="rounded-sm border border-border bg-card p-5 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                        <b.icon className="h-4 w-4 text-gold" />
                      </div>
                      <p className="mt-4 font-display text-sm text-foreground">{b.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{b.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <PremiumButton href="/contact?type=proprietaire" variant="primary">
                    Confier mon appartement <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm shadow-elevation-2 lg:aspect-auto lg:h-full lg:min-h-[400px]">
                <Image
                  src={yakoutImages.ownerConcierge}
                  alt={yakoutImageAlts.ownerConcierge}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Properties V2 ─── */}
        <PropertySectionV2 apartments={featuredApartments} />

        {/* ─── Transfer V2 ─── */}
        <TransferSectionV2 vehicle={skodaVehicle} />

        {/* ─── Trust V2 ─── */}
        <TrustSectionV2 />

        {/* ─── Prise en charge ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-24 md:px-12">
            <div className="mx-auto max-w-xl text-center">
              <div className="inline-flex items-center gap-3">
                <span className="ruby-diamond" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Prise en charge</p>
                <span className="ruby-diamond" />
              </div>
              <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
                Ce que Yakout prend en charge
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
                Une offre complète pour les voyageurs et les propriétaires à Marrakech.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-8 shadow-elevation-1 hover:border-gold/10 transition-all duration-300">
                <h3 className="font-display text-lg text-foreground">Pour les voyageurs</h3>
                <div className="mt-6 grid gap-4">
                  {coverageTravelers.map((c) => (
                    <div key={c.title} className="flex gap-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold/10">
                        <c.icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-sm border border-border bg-card p-8 shadow-elevation-1 hover:border-gold/10 transition-all duration-300">
                <h3 className="font-display text-lg text-foreground">Pour les propriétaires</h3>
                <div className="mt-6 grid gap-4">
                  {coverageOwners.map((c) => (
                    <div key={c.title} className="flex gap-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold/10">
                        <c.icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Method V2 ─── */}
        <MethodSectionV2 />

        {/* ─── FAQ ─── */}
        <section className="border-b border-border bg-surface-light">
          <div className="container mx-auto px-6 py-24 md:px-12">
            <div className="mx-auto max-w-xl text-center">
              <div className="inline-flex items-center gap-3">
                <span className="ruby-diamond" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">FAQ</p>
                <span className="ruby-diamond" />
              </div>
              <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
                Questions fréquentes
              </h2>
              <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
                Tout ce que vous devez savoir avant de nous contacter.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-3xl divide-y divide-border">
              {[
                ["Comment réserver un appartement à Marrakech ?", "Vous pouvez envoyer une demande via le formulaire de contact ou directement sur WhatsApp. Yakout vous répond avec les disponibilités, les informations du bien et les prochaines étapes pour organiser votre séjour."],
                ["Proposez-vous un transfert depuis l'aéroport Marrakech Menara ?", "Oui. Yakout organise les transferts arrivée et départ avec chauffeur privé, selon votre horaire de vol et votre lieu de séjour. Prise en charge avec panneau nominatif à la sortie des bagages."],
                ["Peut-on réserver une voiture avec chauffeur ?", "Oui. Yakout propose une Skoda Kodiaq avec chauffeur et peut également organiser des véhicules partenaires selon le nombre de personnes et le besoin."],
                ["Comment confier mon appartement à Yakout ?", "Vous pouvez remplir le formulaire dédié aux propriétaires sur notre site. Yakout étudie le bien, son emplacement, son potentiel et les conditions de gestion possibles avant de vous proposer un accompagnement."],
                ["Est-ce que Yakout accompagne les propriétaires ?", "Oui. Yakout accompagne les propriétaires sur la mise en valeur du bien, l'accueil voyageurs, le ménage, la maintenance et le suivi de l'activité via un tableau de bord dédié."],
                ["Peut-on demander un service sur mesure ?", "Oui. Les demandes peuvent être étudiées selon votre besoin : séjour, transport, assistance, excursion ou service complémentaire. Contactez-nous pour en discuter."],
                ["Yakout intervient uniquement à Marrakech ?", "Yakout est basée à Marrakech et concentre son activité principale sur Marrakech et ses environs. Des interventions à Agafay, Ourika ou Essaouira sont possibles sur demande."],
              ].map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-foreground transition hover:text-gold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="shrink-0 text-gold transition group-open:rotate-45 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA V2 ─── */}
        <FinalCtaV2 />
      </main>

      <SiteFooter />
    </div>
  );
}
