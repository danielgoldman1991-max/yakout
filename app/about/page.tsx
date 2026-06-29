import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, Shield, MapPin, MessageCircle, Users, Home } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export const metadata: Metadata = {
  title: "Yakout, conciergerie premium à Marrakech",
  description: "Yakout Conciergerie et Services accompagne voyageurs et propriétaires à Marrakech : location d'appartements, conciergerie immobilière et chauffeur privé. Une approche locale, premium et réactive.",
};

const values = [
  { icon: Heart, title: "Sens du service", desc: "Un accueil personnalisé, une écoute active et une réactivité constante pour chaque besoin." },
  { icon: Shield, title: "Exigence et confiance", desc: "Chaque bien est visité, chaque partenaire vérifié. Nous ne travaillons qu'avec des prestataires fiables." },
  { icon: MapPin, title: "Expertise locale", desc: "Une connaissance approfondie de Marrakech pour des recommandations authentiques et pertinentes." },
] as const;

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero éditorial ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">À propos</p>
                <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                  Yakout, conciergerie premium <span className="text-gold">à Marrakech</span>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                  Yakout Conciergerie et Services est née d&apos;une conviction&thinsp;: offrir une expérience
                  d&apos;accueil et de gestion immobilière aussi exigeante qu&apos;humaine à Marrakech.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact" variant="primary">
                    Nous contacter <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={buildWhatsAppUrl()}
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
                  src={yakoutImages.hero}
                  alt={yakoutImageAlts.hero}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Notre histoire ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={yakoutImages.ownerConcierge}
                  alt={yakoutImageAlts.ownerConcierge}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <SectionHeader
                  label="Notre histoire"
                  title="Un service sobre, réactif et attentif aux détails"
                  description="Basée à Marrakech, notre équipe connaît chaque quartier, chaque partenaire et chaque exigence du voyageur contemporain."
                />
                <div className="mt-8 space-y-5 text-[15px] leading-7 text-muted-foreground">
                  <p>
                    Yakout accompagne les voyageurs en quête d&apos;un séjour fluide et les propriétaires
                    souhaitant valoriser leur bien sans contrainte. Nous centralisons la gestion des
                    appartements, l&apos;accueil des voyageurs, la mobilité privée et les services touristiques.
                  </p>
                  <p>
                    Notre approche est simple&thinsp;: un interlocuteur unique, une coordination rigoureuse
                    et une disponibilité constante. Nous sélectionnons chaque bien, chaque partenaire
                    et chaque détail avec la même exigence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Valeurs (grille jointe premium) ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="text-center">
              <SectionHeader
                label="Nos valeurs"
                title="Confiance, exigence et proximité"
                description="Des principes simples qui guident chaque action au quotidien."
              />
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
              {values.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card p-8 transition-all duration-300 hover:bg-surface">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="mt-5 font-display text-lg text-foreground">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pour voyageurs et propriétaires ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Notre mission"
              title="Pour les voyageurs et les propriétaires"
              description="Deux univers complémentaires, une seule exigence de qualité et de discrétion."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-8 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                  <Home className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mt-5 font-display text-lg text-foreground">Je suis voyageur</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Réservez un appartement sélectionné, bénéficiez d&apos;un accueil personnalisé
                  et profitez de services sur mesure&thinsp;: chauffeur, transfert, excursions, assistance WhatsApp.
                </p>
                <div className="mt-6">
                  <Link
                    href="/apartments"
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:text-gold-light"
                  >
                    Voir les appartements <ArrowRight className="ml-1 inline h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="rounded-sm border border-border bg-card p-8 shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mt-5 font-display text-lg text-foreground">Je suis propriétaire</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Confiez-nous votre appartement à Marrakech. Nous gérons les annonces, l&apos;accueil,
                  le ménage, la maintenance et maximisons vos revenus sans aucune contrainte.
                </p>
                <div className="mt-6">
                  <Link
                    href="/concierge"
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:text-gold-light"
                  >
                    Découvrir la conciergerie <ArrowRight className="ml-1 inline h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA final ─── */}
        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Envie d&apos;en savoir plus&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour discuter de votre projet, que vous soyez voyageur ou propriétaire.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact" variant="primary">
                Nous contacter <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl()}
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
