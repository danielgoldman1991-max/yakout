import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BarChart3, CheckCircle2, Home, KeyRound, MessageCircle, Shield, Sparkles, Wrench } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PremiumButton } from "@/components/ui/premium-button";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { SectionHeader } from "@/components/ui/section-header";
import { fallbackImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gestion de bien à Marrakech pour propriétaires | Yakout",
  description:
    "Yakout accompagne les propriétaires à Marrakech dans la mise en valeur, l'exploitation et le suivi quotidien de leur appartement.",
};

const commitments = [
  ["Mise en valeur", "Photos, présentation, recommandations d’équipement et cohérence des annonces.", Sparkles],
  ["Demandes voyageurs", "Qualification des demandes, suivi des échanges et coordination des séjours.", MessageCircle],
  ["Opérations terrain", "Accueil, ménage, maintenance légère et remontée des points à traiter.", Wrench],
  ["Suivi clair", "Vision structurée des réservations, recettes, dépenses et documents utiles.", BarChart3],
] as const;

const steps = [
  ["Diagnostic", "Nous échangeons sur le bien, son état, son potentiel et vos objectifs."],
  ["Préparation", "Nous listons les actions utiles pour rendre l'appartement clair, accueillant et exploitable."],
  ["Exploitation", "Yakout coordonne les demandes, les séjours et les interventions nécessaires."],
  ["Suivi", "Vous gardez une lecture simple de l'activité, des recettes et des dépenses liées au bien."],
] as const;

const faq = [
  ["Yakout garantit-il un revenu ?", "Non. Nous ne promettons pas de rendement garanti : nous travaillons la qualité, la clarté et le suivi pour mieux exploiter le potentiel réel du bien."],
  ["Le bien doit-il être déjà meublé ?", "Un bien meublé et équipé est préférable. Si nécessaire, Yakout peut recommander les améliorations prioritaires avant mise en avant."],
  ["Puis-je garder la main sur certaines décisions ?", "Oui. Le niveau d'accompagnement se définit avec le propriétaire selon le bien, les disponibilités et les besoins opérationnels."],
] as const;

const ownerScopes = [
  ["Mise en valeur du bien", "Présentation claire, photos adaptées, conseils d’amélioration et cohérence de l’offre.", Home],
  ["Gestion des demandes", "Réponse aux demandes voyageurs, qualification du besoin et préparation des séjours.", KeyRound],
  ["Suivi propriétaire", "Recettes, dépenses, documents et points d’attention restent structurés dans l’espace de gestion.", Shield],
] as const;

export default function ProprietairesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto grid gap-12 px-6 py-20 md:px-12 md:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Propriétaires</p>
              <h1 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.05] text-foreground">
                Confiez la gestion de votre bien à Marrakech
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
                Yakout accompagne les propriétaires dans la mise en valeur, l’exploitation et le suivi quotidien de leur appartement.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PremiumButton href="/contact?type=proprietaire" variant="primary" size="lg">
                  Confier mon bien <ArrowRight className="h-4 w-4" />
                </PremiumButton>
                <PremiumButton href="/contact" variant="outline" size="lg">
                  Nous contacter
                </PremiumButton>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border bg-card shadow-elevation-2">
              <Image
                src={fallbackImages.concierge.url}
                alt={fallbackImages.concierge.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-18 md:px-12 md:py-24">
            <SectionHeader
              label="Accompagnement"
              title="Une gestion pensée pour la confiance"
              description="Chaque bien est traité comme une adresse réelle, avec des besoins concrets, des voyageurs à accueillir et un propriétaire à tenir informé."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {commitments.map(([title, description, Icon]) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <h2 className="mt-5 font-display text-lg text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto grid gap-12 px-6 py-18 md:px-12 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeader label="Méthode" title="Un processus simple, sans promesse irréaliste" />
              <p className="mt-5 text-sm leading-8 text-muted-foreground">
                L’objectif est de rendre le bien plus lisible, plus fluide à exploiter et mieux suivi au quotidien, sans annoncer de revenus garantis.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map(([title, description], index) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-4 font-display text-lg text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-18 md:px-12 md:py-24">
            <div className="grid gap-6 lg:grid-cols-3">
              {ownerScopes.map(([title, description, Icon]) => (
                <div key={title} className="rounded-sm border border-border bg-card p-7">
                  <Icon className="h-6 w-6 text-gold" />
                  <h2 className="mt-5 font-display text-xl text-foreground">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-18 md:px-12 md:py-24">
            <SectionHeader label="Questions fréquentes" title="Avant de confier votre appartement" />
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {faq.map(([question, answer]) => (
                <div key={question} className="rounded-sm border border-border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{question}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto px-6 py-18 text-center md:px-12 md:py-24">
            <h2 className="font-display text-3xl text-foreground">Parlons de votre bien à Marrakech</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Envoyez-nous les premières informations sur l’appartement. Yakout vous répondra avec les prochaines étapes utiles.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PremiumButton href="/contact?type=proprietaire" variant="primary" size="lg">
                Confier mon bien <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <PremiumButton href="/contact" variant="outline" size="lg">
                Nous contacter
              </PremiumButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
