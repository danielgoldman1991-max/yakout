import Link from "next/link";
import { Plane, Car, ArrowRight, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function TransfersPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / Transferts & Chauffeur</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Transferts & Chauffeur</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Organisez les demandes de transfert aéroport, trajets privés et mises à disposition.
        </p>
      </div>

      <EmptyState
        icon={Plane}
        title="Aucun transfert planifié"
        description="Les demandes de transfert et de chauffeur apparaîtront ici. Pour le moment, suivez les trajets dans la section dédiée."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/trips"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-gold px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
            >
              <Car className="h-4 w-4" />
              Voir les trajets
            </Link>
            <Link
              href="/dashboard/leads"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border/60 bg-card px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold hover:shadow-elevation-2"
            >
              <MessageCircle className="h-4 w-4" />
              Voir les demandes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />
    </div>
  );
}
