import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles, Shield, Users, Check, Star, BarChart3, MessageCircle, DollarSign } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export const metadata: Metadata = {
  title: "Conciergerie immobilière pour propriétaires à Marrakech",
  description: "Confiez votre appartement à Yakout à Marrakech. Gestion complète des annonces, accueil voyageurs, ménage professionnel, maintenance et suivi des revenus. Maximisez vos revenus sans contrainte.",
};

const services = [
  { icon: Sparkles, title: "Mise en valeur du bien", desc: "Photos professionnelles, descriptions optimisées et tarification dynamique pour maximiser votre visibilité." },
  { icon: Users, title: "Accueil des voyageurs", desc: "Check-in et check-out physiques ou autonomes. Accueil personnalisé et disponible 7j/7." },
  { icon: Star, title: "Ménage professionnel", desc: "Coordination du ménage entre chaque séjour. Linge de maison fourni et contrôles qualité réguliers." },
  { icon: BarChart3, title: "Suivi des réservations", desc: "Gestion complète du calendrier, des disponibilités et des communications avec les voyageurs." },
  { icon: Shield, title: "Maintenance et dépannage", desc: "Interventions rapides : plomberie, électricité, serrurerie. Réseau d'artisans fiables." },
  { icon: DollarSign, title: "Valorisation et revenus", desc: "Optimisation du prix de nuitée et petits travaux de valorisation pour augmenter vos revenus." },
];

const steps = [
  { num: "01", title: "Contact", desc: "Vous nous contactez pour une étude gratuite de votre bien." },
  { num: "02", title: "Visite et diagnostic", desc: "Nous visitons votre appartement et définissons ensemble une stratégie de location." },
  { num: "03", title: "Mise en valeur", desc: "Photos professionnelles, description et publication sur les plateformes." },
  { num: "04", title: "Gestion au quotidien", desc: "Nous gérons tout : accueil, ménage, maintenance, communication voyageurs." },
  { num: "05", title: "Reporting mensuel", desc: "Vous recevez un rapport clair avec vos revenus, taux d'occupation et avis." },
];

const faq = [
  { q: "Quels types de biens gérez-vous ?", a: "Nous gérons des appartements de standing à Marrakech, principalement dans les quartiers Gueliz, Hivernage et Palmeraie." },
  { q: "Comment sont fixés les tarifs de location ?", a: "Nous ajustons les tarifs selon la saison, le taux d'occupation et la demande pour maximiser vos revenus." },
  { q: "Que se passe-t-il en cas de problème technique ?", a: "Nous disposons d'un réseau d'artisans fiables pour intervenir rapidement sur tout type de dépannage." },
  { q: "Comment sont reversés les revenus ?", a: "Les revenus sont reversés mensuellement par virement bancaire, accompagnés d'un reporting détaillé." },
];

export default async function ConciergePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero propriétaire premium ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Conciergerie propriétaire</p>
                <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                  Conciergerie immobilière pour propriétaires <span className="text-gold">à Marrakech</span>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                  Vous êtes propriétaire d&apos;un appartement à Marrakech&thinsp;? Nous gérons tout pour vous&thinsp;:
                  annonces, accueil des voyageurs, ménage, maintenance et suivi des réservations.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=proprietaire" variant="primary">
                    Confier mon bien <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, je souhaite confier mon appartement à Marrakech.")}
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
                  src={yakoutImages.ownerConcierge}
                  alt={yakoutImageAlts.ownerConcierge}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Pourquoi confier son appartement ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={yakoutImages.apartmentPremium}
                  alt={yakoutImageAlts.apartmentPremium}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <SectionHeader
                  label="Pourquoi confier votre appartement"
                  title="Votre bien entre de bonnes mains"
                  description="Nous connaissons le marché de la location courte durée à Marrakech et mettons notre expertise à votre service."
                />
                <div className="mt-8 space-y-5">
                  {[
                    ["Reporting mensuel transparent", "Chiffre d'affaires, taux d'occupation, avis voyageurs : tout est clair et accessible."],
                    ["Optimisation des revenus", "Ajustement des tarifs selon la saison et la demande pour maximiser votre rentabilité."],
                    ["Tranquillité totale", "Vous ne gérez plus rien. Nous nous occupons de tout, de l'annonce au départ du voyageur."],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-4">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Ce que Yakout prend en charge ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Nos services"
              title="Une gestion complète pour les propriétaires"
              description="Nous prenons en charge chaque aspect de la location courte durée pour maximiser vos revenus sans contrainte."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => {
                const Icon = s.icon as LucideIcon;
                return (
                  <div key={i} className="bg-card p-8 transition-all duration-300 hover:bg-surface">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/50">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="mt-5 font-display text-lg text-foreground">{s.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Méthode en 5 étapes ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="Notre méthode"
              title="Comment ça fonctionne&thinsp;?"
              description="Un processus simple et transparent pour confier votre bien en toute sérénité."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-5">
              {steps.map((step) => (
                <div key={step.num} className="bg-card p-6 transition-all duration-300 hover:bg-surface">
                  <p className="font-display text-4xl font-bold text-gold/20">{step.num}</p>
                  <h3 className="mt-4 font-display text-base text-foreground">{step.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ propriétaire ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader
              label="FAQ"
              title="Questions fréquentes"
              description="Tout ce que vous devez savoir avant de confier votre appartement à Yakout."
            />
            <div className="mt-12 grid gap-3 max-w-3xl">
              {faq.map(({ q, a }) => (
                <details key={q} className="group rounded-sm border border-border bg-card transition-all duration-200 open:border-gold/20 open:shadow-elevation-1">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-foreground transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="ml-4 text-gold transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>
                  <div className="border-t border-border px-6 py-4 text-sm leading-7 text-muted-foreground">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Prêt à confier votre bien&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Contactez-nous pour une étude personnalisée de votre appartement à Marrakech.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=proprietaire" variant="primary">
                Confier mon bien <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl("Bonjour Yakout, je souhaite confier mon appartement à Marrakech.")}
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
