import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/premium-button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Apartment } from "@/types/business";
import { ApartmentCard } from "./apartment-card";

export function ApartmentsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-sm border border-border bg-surface">
          <div className="aspect-[4/3] animate-pulse bg-card" />
          <div className="space-y-3 p-6">
            <div className="h-4 w-3/4 animate-pulse rounded bg-card" />
            <div className="h-3 w-full animate-pulse rounded bg-card" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-card" />
            <div className="flex gap-3">
              <div className="h-5 w-16 animate-pulse rounded-full bg-card" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-card" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-24 animate-pulse rounded bg-card" />
              <div className="h-10 w-32 animate-pulse rounded-sm bg-card" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApartmentsEmptyState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Aucun appartement ne correspond exactement à votre recherche"
      description="Modifiez vos critères ou laissez Yakout vous proposer une solution adaptée."
      action={
        <div className="flex flex-wrap justify-center gap-4">
          <PremiumButton href="/apartments" variant="primary">
            Réinitialiser les filtres
          </PremiumButton>
          <PremiumButton href="/contact?type=reservation" variant="secondary">
            Me faire conseiller
          </PremiumButton>
        </div>
      }
    />
  );
}

export function ApartmentsErrorState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Nos appartements sont temporairement indisponibles"
      description="Une erreur technique est survenue. Contactez-nous directement pour être aidé dans votre recherche."
      action={
        <Link
          href="/contact?type=reservation"
          className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
        >
          Nous contacter
        </Link>
      }
    />
  );
}

export function ApartmentsGrid({ apartments }: { apartments: Apartment[] }) {
  if (apartments.length === 0) return <ApartmentsEmptyState />;

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {apartments.map((apartment) => (
        <ApartmentCard key={apartment.id} apartment={apartment} />
      ))}
    </div>
  );
}
