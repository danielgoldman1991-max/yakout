import { Heart, Search, Sparkles, Send, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: { title: string; desc: string; icon: LucideIcon; num: string }[] = [
  { title: "Écoute", desc: "Comprendre le besoin avant de proposer une solution.", icon: Heart, num: "01" },
  { title: "Qualification", desc: "Identifier le type de séjour, de bien, de trajet ou de service souhaité.", icon: Search, num: "02" },
  { title: "Proposition", desc: "Orienter vers l'appartement, le chauffeur ou la prestation la plus adaptée.", icon: Sparkles, num: "03" },
  { title: "Organisation", desc: "Coordonner les informations, horaires, accès et paiements.", icon: Send, num: "04" },
  { title: "Suivi", desc: "Assurer une communication claire avant, pendant et après la prestation.", icon: Clock, num: "05" },
];

export function MethodSectionV2() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center gap-3">
            <span className="ruby-diamond" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Méthode</p>
            <span className="ruby-diamond" />
          </div>
          <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
            Une approche locale, humaine et structurée
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
            Ce qui fait la différence chez Yakout.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-5">
          {steps.map((step) => (
            <div
              key={step.title}
              className="group relative rounded-sm border border-border bg-card p-8 shadow-elevation-1 transition-all duration-500 hover:-translate-y-1 hover:border-gold/15 hover:shadow-elevation-3"
            >
              <span className="font-display text-6xl font-bold tracking-tight text-white/[0.02] transition-colors duration-500 group-hover:text-gold/[0.05]">
                {step.num}
              </span>
              <div className="relative -mt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5 transition-colors duration-300 group-hover:bg-gold/10">
                  <step.icon className="h-4 w-4 text-gold" />
                </div>
                <h3 className="mt-5 font-display text-base text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
