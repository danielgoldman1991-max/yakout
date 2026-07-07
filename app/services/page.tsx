import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, Car, Check, KeyRound, Plane, Shield, Star, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";

export const metadata: Metadata = {
  title: "Services de conciergerie, séjour et transport privé à Marrakech",
  description:
    "Découvrez les services Yakout à Marrakech : appartements premium, conciergerie propriétaire, transport privé, transfert aéroport, véhicule adapté avec chauffeur et services touristiques sur mesure.",
};

const services = [
  {
    icon: Building2,
    title: "Location d'appartements à Marrakech",
    desc: "Des biens sélectionnés dans les meilleurs quartiers, équipés et prêts à vous accueillir pour un séjour premium en toute tranquillité.",
    cta: { href: "/apartments", label: "Voir les appartements" },
  },
  {
    icon: KeyRound,
    title: "Conciergerie propriétaire",
    desc: "Vous êtes propriétaire à Marrakech ? Nous gérons tout : annonces, accueil voyageurs, ménage, maintenance et suivi des revenus.",
    cta: { href: "/proprietaires", label: "Découvrir l'accompagnement" },
  },
  {
    icon: Car,
    title: "Transport privé",
    desc: "Véhicule avec chauffeur professionnel à Marrakech : berline confort, SUV premium, 4x4 de luxe ou van touristique selon votre besoin.",
    cta: { href: "/contact?type=transport", label: "Demander un transport" },
  },
  {
    icon: Plane,
    title: "Transfert aéroport Marrakech",
    desc: "Accueil personnalisé à l'aéroport Marrakech Menara avec panneau nominatif et prise en charge jusqu'à votre hébergement.",
    cta: { href: "/contact?type=transport", label: "Réserver un transfert" },
  },
  {
    icon: Car,
    title: "Véhicule adapté avec chauffeur",
    desc: "Yakout propose la catégorie de véhicule adaptée au trajet, aux passagers et aux bagages : berline confort, SUV premium, 4x4 de luxe ou van touristique selon disponibilité.",
    cta: { href: "/contact?type=transport", label: "Demander un transport" },
  },
  {
    icon: Star,
    title: "Services touristiques sur mesure",
    desc: "Excursions, activités, conseils et accompagnement personnalisé pour découvrir Marrakech et ses environs autrement.",
    cta: { href: "/contact?type=services", label: "Organiser mon séjour" },
  },
] as const;

const reasons = [
  ["Approche sur mesure", "Chaque demande est unique. Nous construisons une solution adaptée à vos besoins spécifiques.", Users],
  ["Interlocuteur unique", "Un seul contact pour tous vos besoins à Marrakech. Simple, fluide, efficace.", Shield],
  ["Expertise locale", "Nous connaissons Marrakech et ses quartiers pour vous recommander les meilleures options.", Star],
  ["Réactivité", "Réponse rapide à chaque demande, par téléphone, email ou WhatsApp.", Check],
] as const;

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Services</p>
              <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] text-foreground">
                Services de conciergerie, séjour et transport privé <span className="text-gold">à Marrakech</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                Une gamme complète de services premium pensés pour les voyageurs exigeants et les propriétaires souhaitant valoriser leur bien sans contrainte.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <PremiumButton href="/contact" variant="primary">
                  Demander un devis <ArrowRight className="h-4 w-4" />
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Nos prestations"
              title="Une offre complète pour chaque besoin"
              description="De la réservation d'appartement à la conciergerie propriétaire, chaque service est pensé pour vous offrir une expérience fluide et premium."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div key={service.title} className="group bg-card p-8 transition-all duration-300 hover:bg-surface">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/60">{String(index + 1).padStart(2, "0")}</p>
                    <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <h2 className="mt-5 font-display text-lg text-foreground transition-colors duration-300 group-hover:text-gold">
                      {service.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.desc}</p>
                    <div className="mt-6">
                      <Link href={service.cta.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-gold transition hover:text-gold-light">
                        {service.cta.label} <ArrowRight className="ml-1 inline h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeader
                label="Pourquoi Yakout"
                title="Un service sur mesure pour chaque besoin"
                description="Notre équipe construit la solution adaptée à votre séjour ou à votre bien, avec une approche locale et premium."
              />
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.map(([title, desc, Icon]) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <h2 className="mt-4 font-display text-sm text-foreground">{title}</h2>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous directement, nous trouverons la solution adaptée à vos besoins.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact" variant="primary">
                Nous contacter <ArrowRight className="h-4 w-4" />
              </PremiumButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
