import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Car, Package, Sparkles, MessageCircle, Search, Heart, Send } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { ApartmentCard } from "@/components/apartments/apartment-card";
import { getPublicApartments } from "@/lib/data";
import { getPublicVehicles } from "@/lib/data/public-vehicles";
import { site } from "@/lib/constants/site";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Yakout Marrakech — Appartements, transport privé et séjours sur mesure",
  description:
    "Yakout organise vos séjours à Marrakech : appartements sélectionnés, transport privé, chauffeur, circuits et services sur mesure. Une expérience simple et fluide.",
  openGraph: {
    title: "Yakout — Appartements, transport privé et séjours à Marrakech",
    description:
      "Découvrez des appartements sélectionnés, un transport privé fiable et des services sur mesure pour vos séjours à Marrakech.",
  },
};

export default async function HomePage() {
  const apartments = await getPublicApartments();
  const vehicles = await getPublicVehicles();
  const featured = apartments.filter((a) => a.is_featured).slice(0, 3);
  const displayApts = featured.length >= 3 ? featured : apartments.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main>
        {/* ─── Hero ─── */}
        <section className="relative flex min-h-[75vh] items-center overflow-hidden border-b border-border/40">
          <div className="absolute inset-0">
            <Image
              src={yakoutImages.hero}
              alt={yakoutImageAlts.hero}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/90 via-[#1a1410]/70 to-transparent" />
          </div>
          <div className="relative z-10 w-full py-32 md:py-40">
            <div className="container mx-auto px-6 md:px-12">
              <div className="max-w-2xl">
                <span className="ruby-diamond" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold/90">
                  Hospitalité privée à Marrakech
                </p>
                <h1 className="mt-5 font-display text-[clamp(2rem,5.5vw,4rem)] font-semibold leading-[1.04] tracking-tight text-white">
                  Votre séjour à Marrakech, pensé dans les moindres détails
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-white/70">
                  Appartements sélectionnés, transport privé, circuits et services sur mesure : Yakout coordonne votre séjour dans une expérience simple et fluide.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=package" variant="primary" size="lg">
                    Organiser mon séjour <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <PremiumButton href="/apartments" variant="secondary" size="lg">
                    Découvrir les appartements
                  </PremiumButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Promesse service ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-16 md:px-12 md:py-20">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { icon: Building2, title: "Appartements sélectionnés", desc: "Des logements vérifiés, bien situés et confortables pour vos séjours." },
                { icon: Car, title: "Transport privé fiable", desc: "Transferts, chauffeur et circuits organisés par une équipe locale." },
                { icon: Package, title: "Packs sur mesure", desc: "Des séjours prêts à l'emploi ou entièrement personnalisables." },
                { icon: Sparkles, title: "Services & assistance", desc: "Accompagnement avant, pendant et après votre séjour." },
              ].map((item) => (
                <div key={item.title} className="rounded-sm border border-border/60 bg-card p-6 transition hover:border-gold/15">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <item.icon className="h-4 w-4 text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-base text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Appartements ─── */}
        {displayApts.length > 0 && (
          <section className="border-b border-border bg-background">
            <div className="container mx-auto px-6 py-16 md:px-12 md:py-24">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Hébergement</p>
                  <h2 className="mt-3 font-display text-2xl text-foreground md:text-3xl">Appartements sélectionnés</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Des logements choisis avec soin pour vos séjours à Marrakech.</p>
                </div>
                <Link href="/apartments" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gold transition hover:gap-2">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayApts.map((apt, i) => (
                  <ApartmentCard key={apt.id} apartment={apt} priority={i === 0} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Transport privé ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-16 md:px-12 md:py-24">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Transport privé</p>
                <h2 className="mt-3 font-display text-2xl text-foreground md:text-3xl">Déplacez-vous en toute sérénité</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Transfert aéroport, chauffeur privé, demi-journée ou journée complète : Yakout vous propose des véhicules confortables avec chauffeurs professionnels.
                </p>
                {vehicles.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {vehicles.slice(0, 3).map((v) => (
                      <span key={v.id} className="rounded-full border border-gold/10 bg-gold/5 px-3 py-1 text-xs text-gold">
                        {v.public_name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/transport"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-7 text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
                  >
                    Découvrir le transport <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/3] hidden md:block">
                <Image
                  src={yakoutImages.skodaChauffeur}
                  alt={yakoutImageAlts.skodaChauffeur}
                  fill
                  className="rounded-sm object-cover"
                  sizes="(max-width: 768px) 0, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Fonctionnement ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-16 text-center md:px-12 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Fonctionnement</p>
            <h2 className="mx-auto mt-3 max-w-lg font-display text-2xl text-foreground md:text-3xl">Comment Yakout organise votre séjour</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Heart, step: "01", title: "Vous nous parlez de votre projet", desc: "Dates, voyageurs, style de séjour : on écoute avant de proposer." },
                { icon: Search, step: "02", title: "Nous composons la meilleure solution", desc: "Appartement, transport, services : on assemble les éléments adaptés." },
                { icon: Send, step: "03", title: "Vous profitez de votre séjour", desc: "Coordination, assistance et suivi pendant toute la durée." },
              ].map((item) => (
                <div key={item.step} className="rounded-sm border border-border bg-card p-8 transition hover:border-gold/15">
                  <span className="font-display text-5xl font-bold tracking-tight text-gold/[0.06]">{item.step}</span>
                  <div className="relative -mt-3">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                      <item.icon className="h-4 w-4 text-gold" />
                    </div>
                    <h3 className="mt-4 font-display text-base text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Propriétaires ─── */}
        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-16 md:px-12 md:py-24">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="relative aspect-[4/3] hidden md:block">
                <Image
                  src={yakoutImages.ownerConcierge}
                  alt={yakoutImageAlts.ownerConcierge}
                  fill
                  className="rounded-sm object-cover"
                  sizes="(max-width: 768px) 0, 50vw"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Propriétaires</p>
                <h2 className="mt-3 font-display text-2xl text-foreground md:text-3xl">Vous possédez un appartement à Marrakech ?</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Confiez-nous votre bien pour bénéficier d&rsquo;un accompagnement structuré : mise en valeur, traitement des demandes, accueil des voyageurs et suivi des recettes.
                </p>
                <div className="mt-8">
                  <Link
                    href="/contact?type=proprietaire"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-8 text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
                  >
                    Confier mon bien <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA final ─── */}
        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-sm border border-gold/10 bg-surface px-10 py-16 text-center md:px-20 md:py-20">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold/5 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Prêt à organiser votre séjour ?</p>
                <h2 className="mt-4 font-display text-2xl text-foreground md:text-3xl">
                  Envoyez votre demande, on s&rsquo;occupe du reste
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                  Appartements, transport, circuits, services : dites-nous ce dont vous avez besoin et nous composons la solution adaptée.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <PremiumButton href="/contact?type=general" variant="primary">
                    Faire une demande <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <Link
                    href={`https://wa.me/${site.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(site.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-xs font-semibold uppercase tracking-[0.1em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter sur WhatsApp
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
