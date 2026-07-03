import { MapPin, MessageCircle, Building2, Car, Search, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const trustItems: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "Présence locale à Marrakech", desc: "Une connaissance terrain pour organiser les séjours et suivre les opérations.", icon: MapPin },
  { title: "Réponse rapide sur WhatsApp", desc: "Des échanges simples et directs pour qualifier chaque demande.", icon: MessageCircle },
  { title: "Appartements sélectionnés", desc: "Des biens mis en avant avec attention pour garantir confort et cohérence.", icon: Building2 },
  { title: "Transport prive organise", desc: "Transferts, trajets et excursions planifies avec serieux.", icon: Car },
  { title: "Suivi des demandes", desc: "Chaque demande peut être suivie depuis votre espace de gestion interne.", icon: Search },
  { title: "Accompagnement voyageurs et propriétaires", desc: "Une approche pensée pour les deux côtés du service.", icon: Heart },
];

export function TrustSectionV2() {
  return (
    <section className="border-b border-border bg-surface-light">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center gap-3">
            <span className="ruby-diamond" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Pourquoi nous</p>
            <span className="ruby-diamond" />
          </div>
          <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
            Pourquoi faire confiance à Yakout ?
          </h2>
          <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
            Une présence locale, une organisation claire et une approche premium pour accompagner voyageurs et propriétaires à Marrakech.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item.title} className="bg-card p-8 transition-all duration-300 hover:bg-surface">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                <item.icon className="h-4 w-4 text-gold" />
              </div>
              <h3 className="mt-5 font-display text-base text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
