"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { formatCurrency } from "@/lib/formatters";
import type { PublicPackageModel } from "@/lib/packages/public-packages";

type Props = {
  packages: PublicPackageModel[];
  isFallback?: boolean;
};

const styleFilters = ["Tous", "Couple", "Famille", "Premium", "Nature", "Decouverte", "Court sejour", "Sejour complet"];
const levelFilters = ["Tous les niveaux", "Arrivee simple", "Sejour confort", "Decouverte accompagnee", "Experience premium", "Sejour complet", "Sur mesure"];

export function PackagesExperience({ packages, isFallback = false }: Props) {
  const [styleFilter, setStyleFilter] = useState("Tous");
  const [levelFilter, setLevelFilter] = useState("Tous les niveaux");

  const filteredPackages = useMemo(() => {
    return packages.filter((pack) => {
      const styleMatch = styleFilter === "Tous" || pack.styleTags.includes(styleFilter);
      const levelMatch = levelFilter === "Tous les niveaux" || pack.levelLabel === levelFilter;
      return styleMatch && levelMatch;
    });
  }, [packages, styleFilter, levelFilter]);

  const featured = packages[0];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0">
          <Image src="/images/yakout/yakout-brand-moroccan-bg-v2.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/55" />
        </div>

        <div className="container relative mx-auto grid min-h-[calc(100vh-80px)] gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Sejours prives a Marrakech
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,7vw,5.7rem)] font-semibold leading-[0.98] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              Composez votre sejour a Marrakech avec Yakout
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-muted-foreground sm:text-base">
              Choisissez un pack pret a reserver ou composez votre propre combinaison : appartement, transfert, chauffeur, vehicule, circuit et services sur mesure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="/contact?type=package" variant="primary" size="lg">
                Composer mon pack sur mesure <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <PremiumButton href="#packs-prets" variant="outline" size="lg">
                Voir les packs prets
              </PremiumButton>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {["Appartement", "Chauffeur", "Agafay", "Transfert"].map((label, index) => (
                <div key={label} className="rounded-sm border border-white/10 bg-white/[0.055] p-3 shadow-elevation-1 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-gold/25 hover:bg-gold/10" style={{ transitionDelay: `${index * 35}ms` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {featured ? (
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 rounded-[2rem] border border-gold/15 bg-gold/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.065] shadow-elevation-3 backdrop-blur-xl">
                <div className="relative aspect-[4/3]">
                  <Image src={featured.displayImage} alt={featured.displayImageAlt} fill priority sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-gold/25 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold backdrop-blur">
                    Pack recommande
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gold">{featured.levelLabel}</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold">{featured.public_title ?? featured.title}</h2>
                    </div>
                    <PriceChip value={featured.price_from} />
                  </div>
                  <IncludedTimeline items={featured.package_items?.slice(0, 5).map((item) => item.title) ?? []} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section id="packs-prets" className="container mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Packs prets a reserver</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Des combinaisons claires, ajustables en une demande.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Chaque modele sert de point de depart : vous pouvez le demander tel quel ou le personnaliser avec Yakout.
            </p>
          </div>
          {isFallback ? (
            <div className="rounded-sm border border-gold/20 bg-gold/8 px-4 py-3 text-xs leading-6 text-muted-foreground">
              Modeles affiches en attente des packs publies dans Supabase.
            </div>
          ) : null}
        </div>

        <div className="mt-8 space-y-4 rounded-sm border border-border/60 bg-card/60 p-3 shadow-elevation-1 backdrop-blur">
          <FilterRail label="Style de sejour" icon={<SlidersHorizontal className="h-4 w-4" />} items={styleFilters} value={styleFilter} onChange={setStyleFilter} />
          <FilterRail label="Niveau d'accompagnement" icon={<Layers3 className="h-4 w-4" />} items={levelFilters} value={levelFilter} onChange={setLevelFilter} />
          <p className="px-2 pb-1 text-xs leading-6 text-muted-foreground">
            Un pack peut etre demande tel quel ou utilise comme base pour composer votre sejour.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Vous voulez simple", "Choisissez Arrivee simple ou Sejour confort."],
            ["Vous voulez decouvrir Marrakech", "Choisissez Decouverte accompagnee ou Nature."],
            ["Vous voulez un sejour cle en main", "Choisissez Experience premium ou Sejour complet."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-sm border border-border/60 bg-surface/35 p-4">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPackages.map((pack) => (
            <PackageCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/35">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Comparez les packs</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">Comprendre vite la difference.</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Hebergement, transfert, chauffeur, circuit et assistance : le niveau monte progressivement jusqu&apos;a l&apos;experience complete.
              </p>
            </div>
            <div className="hidden overflow-hidden rounded-sm border border-border bg-card shadow-elevation-1 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gold/8 text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pack</th>
                    <th className="px-4 py-3 font-medium">Hebergement</th>
                    <th className="px-4 py-3 font-medium">Transfert</th>
                    <th className="px-4 py-3 font-medium">Chauffeur</th>
                    <th className="px-4 py-3 font-medium">Circuit</th>
                    <th className="px-4 py-3 font-medium">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pack) => (
                    <tr key={pack.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{pack.public_title ?? pack.title}</td>
                      <CompareCell active={hasItem(pack, ["appartement", "hebergement"])} />
                      <CompareCell active={hasItem(pack, ["transfert", "aeroport"])} />
                      <CompareCell active={hasItem(pack, ["chauffeur", "suv", "vehicule"])} />
                      <CompareCell active={hasItem(pack, ["circuit", "ourika", "agafay", "tour"])} />
                      <td className="px-4 py-3 text-gold">{formatPrice(pack.price_from)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {packages.map((pack) => (
                <div key={pack.id} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{pack.public_title ?? pack.title}</p>
                    <PriceChip value={pack.price_from} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <MobileCompare label="Hebergement" active={hasItem(pack, ["appartement", "hebergement"])} />
                    <MobileCompare label="Transfert" active={hasItem(pack, ["transfert", "aeroport"])} />
                    <MobileCompare label="Chauffeur" active={hasItem(pack, ["chauffeur", "suv", "vehicule"])} />
                    <MobileCompare label="Circuit" active={hasItem(pack, ["circuit", "ourika", "agafay", "tour"])} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ["1", "Choisissez une base", "Pack pret ou inspiration parmi les modeles Yakout."],
            ["2", "Ajustez les services", "Dates, voyageurs, vehicule, chauffeur, circuit et options."],
            ["3", "Recevez une proposition", "Yakout confirme les disponibilites et le budget final."],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-sm border border-border bg-card p-6 shadow-elevation-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-sm font-semibold text-gold">{number}</div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-sm border border-gold/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(123,0,28,0.12),rgba(248,245,239,0.04))] p-6 shadow-elevation-2 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Pack builder</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">Vous voulez partir de zero ?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Indiquez vos dates, le nombre de voyageurs et les services souhaites. Le builder centralise votre demande dans le pipeline leads.
              </p>
            </div>
            <PremiumButton href="/contact?type=package&mode=custom" variant="primary" size="lg">
              Composer mon pack <ArrowRight className="h-4 w-4" />
            </PremiumButton>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-28">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Puis-je modifier un pack pret ?", "Oui. Le bouton Personnaliser part du modele choisi et Yakout adapte les elements."],
            ["Le prix est-il fixe ?", "Le prix depend des dates, disponibilites, capacites et options. Si le pack n'a pas de prix, il passe sur estimation rapide."],
            ["Puis-je demander seulement un transfert ?", "Oui. Le pack Essentiel Arrivee sert justement aux clients qui ont deja leur logement."],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-sm border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">{question}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/88 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <PremiumButton href="/contact?type=package&mode=custom" variant="primary" className="flex-1">
            Composer
          </PremiumButton>
          <PremiumButton href="#packs-prets" variant="outline" className="flex-1">
            Packs
          </PremiumButton>
        </div>
      </div>
    </>
  );
}

function PackageCard({ pack }: { pack: PublicPackageModel }) {
  const title = pack.public_title ?? pack.title;
  const items = pack.package_items?.filter((item) => !item.is_optional).slice(0, 5) ?? [];

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-card shadow-elevation-1 transition duration-300 hover:-translate-y-1 hover:border-gold/25 hover:shadow-elevation-3">
      <Link href={`/packages/${pack.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={pack.displayImage} alt={pack.displayImageAlt} fill sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gold/25 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold backdrop-blur">{pack.levelLabel}</span>
            <span className="rounded-full border border-white/10 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground backdrop-blur">{pack.servicesCount} services inclus</span>
          </div>
        </div>
      </Link>
      <div className="space-y-5 p-5">
        <div>
          <div className="flex flex-wrap gap-2">
            {pack.styleTags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tag}</span>
            ))}
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{pack.short_description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" />{pack.duration_label}</span>
          <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-gold" />{pack.capacity_min ?? 1}-{pack.capacity_max ?? "sur mesure"} pers.</span>
        </div>

        <IncludedTimeline items={items.map((item) => item.title)} />

        <p className="text-xs leading-6 text-muted-foreground">
          Vous pouvez demander ce pack tel quel ou l&apos;adapter a votre sejour.
        </p>

        <div className="rounded-sm border border-border/60 bg-surface/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">Ideal pour</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{pack.idealFor}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <PriceChip value={pack.price_from} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PremiumButton href={`/contact?type=package&package=${pack.slug}&mode=order`} variant="primary" size="sm" className="min-h-11 w-full px-4 text-center">Demander</PremiumButton>
            <PremiumButton href={`/contact?type=package&basePackage=${pack.slug}&mode=customize`} variant="outline" size="sm" className="min-h-11 w-full px-4 text-center">Personnaliser</PremiumButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function IncludedTimeline({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex gap-3 text-sm">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-[10px] text-gold">{index + 1}</span>
          <span className="text-muted-foreground">{item}</span>
        </div>
      ))}
    </div>
  );
}

function FilterRail({
  label,
  icon,
  items,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
        {icon}
        {label}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
              value === item
                ? "border-gold/30 bg-gold text-primary-foreground shadow-glow-gold"
                : "border-border bg-background/50 text-muted-foreground hover:border-gold/25 hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function PriceChip({ value }: { value?: number | null }) {
  return (
    <div className="rounded-sm border border-gold/20 bg-gold/8 px-3 py-2 text-left sm:shrink-0 sm:text-right">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">A partir de</p>
      <p className="text-sm font-semibold text-gold">{formatPrice(value)}</p>
    </div>
  );
}

function CompareCell({ active }: { active: boolean }) {
  return (
    <td className="px-4 py-3">
      {active ? <CheckCircle2 className="h-4 w-4 text-gold" /> : <span className="text-muted-foreground/35">-</span>}
    </td>
  );
}

function MobileCompare({ label, active }: { label: string; active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-border/60 px-3 py-2">
      {active ? <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> : <span className="h-3.5 w-3.5 rounded-full border border-border" />}
      {label}
    </span>
  );
}

function hasItem(pack: PublicPackageModel, keywords: string[]) {
  const text = `${pack.public_title ?? pack.title} ${(pack.package_items ?? []).map((item) => `${item.title} ${item.description ?? ""}`).join(" ")}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined || Number(value) <= 0) return "Sur estimation";
  return formatCurrency(value);
}
