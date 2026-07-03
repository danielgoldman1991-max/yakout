import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Car, Clock, Compass, MapPin, MessageCircle, Plane, Route, Sparkles, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { SectionHeader } from "@/components/ui/section-header";
import { TransportVehiclesSection } from "@/components/public/transport-vehicles-section";
import { yakoutImages } from "@/lib/images";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Transport prive a Marrakech | Yakout",
  description: "Transport prive a Marrakech : transfert aeroport, chauffeur prive, circuits, mise a disposition, SUV premium, 4x4 de luxe, berline confort ou van touristique selon disponibilite.",
};

const needs = [
  { icon: Plane, title: "Transfert aeroport", desc: "Arrivee ou depart Marrakech Menara, accueil coordonne et trajet direct vers votre hebergement." },
  { icon: Car, title: "Chauffeur prive", desc: "Deplacements en ville, rendez-vous, restaurants, shopping ou sorties avec chauffeur." },
  { icon: Clock, title: "Mise a disposition", desc: "Demi-journee ou journee complete pour accompagner votre programme avec souplesse." },
  { icon: Route, title: "Circuit prive", desc: "Agafay, Ourika, Essaouira, Ouzoud, Imlil ou city tour avec organisation transport." },
  { icon: Users, title: "Famille ou groupe", desc: "Solution adaptee aux passagers, aux bagages et au niveau de confort souhaite." },
  { icon: Sparkles, title: "Vehicule premium", desc: "SUV premium, 4x4 de luxe ou van touristique sur demande et selon disponibilite." },
];

const circuits = ["Agafay", "Ourika", "Essaouira", "Ouzoud", "Imlil", "Marrakech city tour"];

const steps = [
  "Vous indiquez votre besoin",
  "Yakout propose le vehicule adapte",
  "Vous confirmez le trajet",
  "Chauffeur et organisation sont coordonnes",
];

export default function TransportPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        <section className="relative overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Transport prive</p>
                <h1 className="mt-5 font-display text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-tight text-foreground">
                  Transport prive <span className="text-gold">a Marrakech</span>
                </h1>
                <p className="mt-6 max-w-2xl text-[15px] leading-8 text-muted-foreground">
                  Transfert aeroport, chauffeur prive, vehicules adaptes et circuits avec transport. Dites-nous votre besoin, Yakout vous propose la solution la plus confortable.
                </p>
                <div className="mt-7 rounded-sm border border-gold/20 bg-gold/5 p-5 text-sm leading-7 text-muted-foreground">
                  Vous n&apos;avez pas besoin de choisir un modele precis. Indiquez votre trajet, le nombre de passagers et vos bagages : Yakout selectionne le vehicule adapte.
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PremiumButton href="/contact?type=transport" variant="primary">
                    Demander un transport prive <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <PremiumButton href="#solutions" variant="outline">
                    Voir les solutions
                  </PremiumButton>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image src={yakoutImages.airportTransfer} alt="Transport prive Yakout a Marrakech" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" priority />
                <div className="absolute inset-x-4 bottom-4 rounded-sm border border-white/10 bg-background/82 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Besoin d&apos;abord, vehicule ensuite</p>
                  <p className="mt-1 text-sm text-foreground">Du SUV premium au van touristique, selon disponibilite.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader label="Choisissez votre besoin" title="Une demande claire, une solution adaptee" description="Le client exprime son besoin de transport. Yakout coordonne ensuite le chauffeur et la categorie de vehicule." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-sm border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:shadow-elevation-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <h3 className="mt-5 font-display text-base text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <SectionHeader label="Comment ca marche" title="Simple pour le client, coordonne par Yakout" />
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="rounded-sm border border-border bg-card p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-5 text-sm font-medium leading-6 text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image src={yakoutImages.brandMoroccanBg} alt="Circuit prive avec transport a Marrakech" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
              </div>
              <div>
                <SectionHeader label="Circuits avec transport" title="De Marrakech aux plus belles escapades" description="Yakout organise le trajet, le chauffeur et le rythme de votre circuit prive." />
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {circuits.map((circuit) => (
                    <div key={circuit} className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 text-sm text-foreground">
                      <MapPin className="h-4 w-4 text-gold" />
                      {circuit}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <TransportVehiclesSection />

        <section className="bg-background">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <Compass className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-5 font-display text-2xl text-foreground md:text-3xl">Demander mon transport prive</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Du transfert aeroport au circuit prive, Yakout vous propose le vehicule avec chauffeur le plus adapte : berline confort, SUV premium, 4x4 de luxe ou van touristique type Mercedes Vito selon disponibilite.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact?type=transport" variant="primary">
                Demander mon transport prive <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link href={buildWhatsAppUrl("Bonjour Yakout, je souhaite organiser un transport prive a Marrakech.")} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
