import Link from "next/link";
import { Home, MessageCircle, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function OwnersPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / Propriétaires</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Propriétaires</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Suivez les propriétaires qui confient ou souhaitent confier un bien à Yakout.
        </p>
      </div>

      <EmptyState
        icon={Home}
        title="Aucun propriétaire enregistré"
        description="Les propriétaires apparaîtront ici lorsqu'ils nous contacteront via le site ou que vous en ajouterez manuellement."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-gold px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
            >
              <MessageCircle className="h-4 w-4" />
              Page contact site
            </Link>
            <Link
              href="/dashboard/leads"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border/60 bg-card px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold hover:shadow-elevation-2"
            >
              Voir les demandes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />
    </div>
  );
}
