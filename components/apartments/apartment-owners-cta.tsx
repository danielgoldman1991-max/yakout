import Link from "next/link";
import { ArrowRight, Building2, Users, Receipt, Shield } from "lucide-react";

const points = [
  { icon: Building2, text: "Valorisation de votre annonce" },
  { icon: Users, text: "Traitement des demandes et suivi des voyageurs" },
  { icon: Receipt, text: "Suivi des recettes et dépenses" },
  { icon: Shield, text: "Coordination opérationnelle quotidienne" },
];

export function ApartmentOwnersCta() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Propriétaires
            </p>
            <h2 className="mt-4 font-display text-[clamp(1.4rem,3vw,2.4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Vous possédez un appartement à Marrakech&nbsp;?
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
              Confiez-nous votre bien pour bénéficier d&apos;un accompagnement structuré, d&apos;une mise en valeur soignée et d&apos;une gestion quotidienne des séjours.
            </p>
            <ul className="mt-8 space-y-4">
              {points.map((p) => (
                <li key={p.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <p.icon className="h-3 w-3 text-gold" />
                  </span>
                  <span className="text-sm text-foreground">{p.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/contact?type=proprietaire"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
              >
                Confier mon bien <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="aspect-[4/3] rounded-sm border border-border bg-gradient-to-br from-gold/[0.03] to-ruby/[0.03]" />
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-sm border border-gold/5" />
          </div>
        </div>
      </div>
    </section>
  );
}
