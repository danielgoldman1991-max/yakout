import Link from "next/link";
import { ArrowRight, Building2, KeyRound, Car, Sparkles } from "lucide-react";

interface Service {
  id: string;
  title: string;
  short_description: string;
}

const icons = [Building2, KeyRound, Car];
const ctas: Record<string, string> = {
  "Location d'appartements à Marrakech": "/contact?type=reservation",
  "Conciergerie propriétaire": "/contact?type=proprietaire",
  "Chauffeur privé": "/contact?type=chauffeur",
};

export function ServiceShowcaseV2({ services }: { services: Service[] }) {
  const mainServices = services.filter((s) =>
    ["Location d'appartements à Marrakech", "Conciergerie propriétaire", "Chauffeur privé"].includes(s.title)
  );

  if (mainServices.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="ruby-diamond" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Nos services</p>
            <span className="gold-sep" />
          </div>
          <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
            Une conciergerie complète pour voyageurs et propriétaires
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
            Location d{'\''}appartements, conciergerie immobilière, chauffeur privé et services touristiques sur mesure à Marrakech.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
          {mainServices.map((service, i) => {
            const Icon = icons[i] ?? Sparkles;
            const ctaHref = ctas[service.title] ?? "/services";
            return (
              <article
                key={service.id}
                className="group relative bg-gradient-to-br from-card to-surface p-10 shadow-elevation-1 transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-3"
              >
                <span className="font-display text-7xl font-bold tracking-tight text-gold/[0.03] transition-colors duration-500 group-hover:text-gold/[0.07]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative -mt-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-gold/20 bg-gradient-to-br from-gold/8 to-gold/3 shadow-elevation-1 transition-all duration-300 group-hover:border-gold/30 group-hover:shadow-glow-gold">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="mt-6 font-display text-xl text-foreground transition-colors duration-300 group-hover:text-gold">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {service.short_description}
                  </p>
                  <div className="mt-8">
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-2 rounded-sm border border-gold/20 bg-gold/5 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/10 hover:shadow-glow-gold hover:gap-3"
                    >
                      En savoir plus <ArrowRight className="h-3 w-3 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
