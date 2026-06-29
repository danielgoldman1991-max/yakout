import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Star, Shield, Clock, Check, MessageCircle, Plane } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export const metadata: Metadata = {
  title: "Chauffeur privé et transfert aéroport à Marrakech",
  description: "Skoda Kodiaq avec chauffeur privé à Marrakech. Transferts aéroport Marrakech Menara, trajets privés, excursions et mise à disposition. Confort, sécurité, ponctualité.",
};

const prestations = [
  { icon: Plane, title: "Transfert aéroport", desc: "Accueil à l'aéroport Marrakech Menara avec panneau nominatif. Prise en charge jusqu'à votre hébergement.", price: "À partir de 250 MAD" },
  { icon: MapPin, title: "Trajets privés", desc: "Déplacements en ville et alentours en toute discrétion. Idéal pour rendez-vous ou shopping.", price: "À partir de 200 MAD" },
  { icon: Star, title: "Excursions", desc: "Explorez Agafay, Ourika, Essaouira et les environs de Marrakech avec un chauffeur expérimenté.", price: "Sur devis" },
  { icon: Clock, title: "Mise à disposition", desc: "Véhicule et chauffeur à votre disposition pour la demi-journée ou la journée complète.", price: "À partir de 800 MAD/jour" },
];

const benefits = [
  { icon: Shield, title: "Chauffeur professionnel", desc: "Conducteur expérimenté, courtois et ponctuel. Connaissance parfaite de Marrakech." },
  { icon: Star, title: "Skoda Kodiaq premium", desc: "Véhicule climatisé, spacieux et confortable. Entretien rigoureux et propreté irréprochable." },
  { icon: Clock, title: "Ponctualité garantie", desc: "Suivi en temps réel et communication avant chaque prise en charge." },
  { icon: Check, title: "Service personnalisé", desc: "Bouteille d'eau, wifi à bord, sièges bébé sur demande. Chaque détail compte." },
];

export default async function ChauffeurPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero chauffeur privé ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Chauffeur privé</p>
                <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                  Chauffeur privé et transfert aéroport <span className="text-gold">à Marrakech</span>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                  Transferts aéroport, trajets privés et excursions en toute discrétion. Confort,
                  sécurité et ponctualité garantis par un chauffeur professionnel à votre service.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=chauffeur" variant="primary">
                    Réserver un trajet <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, je souhaite réserver un chauffeur privé à Marrakech.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={yakoutImages.skodaChauffeur}
                  alt={yakoutImageAlts.skodaChauffeur}
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

        {/* ─── Transfert aéroport Marrakech ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm order-2 md:order-1">
                <Image
                  src={yakoutImages.airportTransfer}
                  alt={yakoutImageAlts.airportTransfer}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 rounded-sm bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur-sm">
                  Aéroport Marrakech Menara
                </div>
              </div>
              <div className="order-1 md:order-2">
                <SectionHeader
                  label="Transfert aéroport"
                  title="Arrivée à Marrakech Menara&thinsp;?"
                  description="Un chauffeur vous attend à l'aéroport avec un panneau nominatif et vous conduit directement à votre hébergement."
                />
                <div className="mt-8 space-y-4">
                  {[
                    "Accueil personnalisé avec panneau nominatif en zone arrivée",
                    "Suivi en temps réel de votre vol pour ajuster la prise en charge",
                    "Véhicule climatisé, spacieux, avec wifi à bord",
                    "Prise en charge directe vers votre appartement ou hôtel",
                    "Bouteille d'eau et service à bord inclus",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-gold" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Skoda Kodiaq avec chauffeur ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Notre véhicule"
              title="Skoda Kodiaq avec chauffeur"
              description="Un véhicule spacieux, confortable et premium, associé à un chauffeur professionnel pour tous vos déplacements."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Capacité", value: "6 places" },
                { label: "Climatisation", value: "Oui" },
                { label: "Wifi à bord", value: "Oui" },
                { label: "Sièges bébé", value: "Sur demande" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-sm border border-border bg-card px-5 py-4 shadow-elevation-1">
                  <Check className="h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Prestations ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Nos prestations"
              title="Des solutions de mobilité sur mesure"
              description="Transferts, excursions ou mise à disposition : chaque service est pensé pour votre confort."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
              {prestations.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} className="group bg-card p-8 transition-all duration-300 hover:bg-surface">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/50">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="mt-5 font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{p.desc}</p>
                    <p className="mt-4 text-sm font-medium text-gold">{p.price}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Bénéfices ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Pourquoi nous choisir"
              title="Voyagez en toute sérénité"
              description="Un service de transport premium pensé pour votre confort et votre tranquillité."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
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
              Prêt à réserver votre chauffeur&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour réserver votre trajet ou pour construire un itinéraire sur mesure.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=chauffeur" variant="primary">
                Réserver maintenant <ArrowRight className="h-4 w-4" />
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
