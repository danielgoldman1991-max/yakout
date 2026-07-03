import Image from "next/image";
import { ArrowRight, Plane, Map as MapIcon, Sun, Briefcase } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";
import { formatCurrency } from "@/lib/formatters";

interface Vehicle {
  id: string;
  brand?: string;
  model?: string;
  public_name?: string;
  price_from: number;
}

const transferPoints = [
  { icon: Plane, title: "Aéroport Marrakech Menara", desc: "Prise en charge à la sortie des bagages, direction votre hébergement." },
  { icon: MapIcon, title: "Trajets privés", desc: "Déplacements en ville et alentours en tout confort et discrétion." },
  { icon: Sun, title: "Excursions autour de Marrakech", desc: "Agafay, Ourika, Essaouira, Ouarzazate : explorez le Maroc." },
  { icon: Briefcase, title: "Mise à disposition avec chauffeur", desc: "À l'heure, à la demi-journée ou à la journée complète." },
];

export function TransferSectionV2({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container mx-auto px-6 py-24 md:px-12">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-gold/10 shadow-elevation-2">
            <Image
              src={yakoutImages.airportTransfer}
              alt={yakoutImageAlts.airportTransfer}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            {vehicle && (
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-2 rounded-sm bg-background/80 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] backdrop-blur-sm">
                  <span className="text-gold">{[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || vehicle.public_name || "Vehicule avec chauffeur"}</span>
                  <span className="text-muted-foreground">— À partir de {formatCurrency(vehicle.price_from)}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="ruby-diamond" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Transfert & chauffeur</p>
              <span className="gold-sep" />
            </div>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Transfert aéroport et chauffeur privé à Marrakech
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Yakout organise vos transferts, trajets privés et excursions avec chauffeur pour assurer confort, ponctualité et tranquillité dès votre arrivée.
            </p>

            <div className="mt-10 grid gap-4">
              {transferPoints.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
                    <p.icon className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <PremiumButton href="/contact?type=transport" variant="primary">
                Réserver un chauffeur <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <PremiumButton href="/transport" variant="outline">
                Voir les véhicules
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
