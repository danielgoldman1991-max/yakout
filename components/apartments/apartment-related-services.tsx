import Link from "next/link";
import { ArrowRight, Car, Package, MessageCircle, Sparkles } from "lucide-react";

const services = [
  {
    icon: Car,
    title: "Transfert aéroport",
    desc: "Prise en charge à l’aéroport de Marrakech avec chauffeur privé.",
    href: "/transport",
    label: "Voir les transferts",
  },
  {
    icon: Package,
    title: "Packs & séjours",
    desc: "Séjours tout compris avec appartement, transport et activités.",
    href: "/packages",
    label: "Découvrir les packs",
  },
  {
    icon: Sparkles,
    title: "Services avant arrivée",
    desc: "Courses, préparation du logement et organisation de votre séjour.",
    href: "/services",
    label: "Voir les services",
  },
  {
    icon: MessageCircle,
    title: "Assistance locale",
    desc: "Une équipe disponible pendant tout votre séjour à Marrakech.",
    href: "/contact?type=general",
    label: "Nous contacter",
  },
];

export function ApartmentRelatedServices() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
            Bien plus qu&apos;un appartement
          </p>
          <h2 className="mt-4 font-display text-[clamp(1.4rem,3vw,2.4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
            Complétez votre séjour avec Yakout
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            Transport privé, packs clé en main et assistance locale pour un séjour sans aucune contrainte.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-4">
          {services.map((s) => (
            <article key={s.title} className="group bg-surface p-8 transition-all duration-300 hover:bg-surface-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                <s.icon className="h-4 w-4 text-gold" />
              </div>
              <h3 className="mt-5 font-display text-base text-foreground transition-colors duration-300 group-hover:text-gold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {s.desc}
              </p>
              <Link
                href={s.href}
                className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold transition-all hover:gap-2"
              >
                {s.label} <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact?type=package"
            className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
          >
            Composer mon séjour <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
