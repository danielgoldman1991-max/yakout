"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, MapPin } from "lucide-react";
import type { PackageState, PricingBreakdown } from "./types";
import { formatPrice } from "./price-calculator";

type Props = {
  state: PackageState;
  pricing: PricingBreakdown;
};

export function SummarySticky({ state, pricing }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile: compact bar + accordion */}
      <div className="sticky bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-foreground">Votre séjour</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gold">{formatPrice(pricing.estimatedTotal)}</span>
            {mobileOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-border/30 px-4 py-4">
            <SummaryContent state={state} pricing={pricing} />
          </div>
        )}
      </div>

      {/* Desktop: sticky right column */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <div className="rounded-sm border border-border/50 bg-card p-5 shadow-elevation-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Récapitulatif</p>
            <SummaryContent state={state} pricing={pricing} />
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryContent({ state, pricing }: Props) {
  const { stay, apartment, transfers, vehicle, experiences, services } = state;

  return (
    <div className="mt-4 space-y-4">
      {/* Dates & voyageurs */}
      {stay.arrivalDate && (
        <div className="flex items-start gap-2.5 text-xs">
          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
          <div>
            <p className="font-medium text-foreground">
              {new Date(stay.arrivalDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              {stay.departureDate ? ` → ${new Date(stay.departureDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}
              {stay.nights > 0 && <span className="text-muted-foreground"> · {stay.nights} nuits</span>}
            </p>
            <p className="text-muted-foreground/60">{stay.adults} adulte{stay.adults > 1 ? "s" : ""}{stay.children > 0 ? `, ${stay.children} enfant${stay.children > 1 ? "s" : ""}` : ""}</p>
          </div>
        </div>
      )}

      {/* Hébergement */}
      {apartment.type === "selected" && (
        <SummaryLine icon={<MapPin className="h-3.5 w-3.5" />} label={apartment.apartment.title} price={pricing.subtotals.apartment} sub={`${apartment.apartment.district} · ${apartment.apartment.bedrooms} ch.`} />
      )}
      {apartment.type === "recommendation" && (
        <SummaryLine icon={<MapPin className="h-3.5 w-3.5" />} label="Meilleur hébergement proposé" />
      )}

      {/* Transferts */}
      {transfers.length > 0 && transfers.map((t) => (
        <SummaryLine key={t.id} icon={<MapPin className="h-3.5 w-3.5" />} label={t.type === "arrival" ? "Transfert arrivée" : t.type === "departure" ? "Transfert départ" : t.type === "both" ? "Aller-retour aéroport" : t.type === "half_day" ? "Chauffeur ½ journée" : t.type === "full_day" ? "Chauffeur journée" : "Trajet ville"} />
      ))}

      {/* Véhicule */}
      {vehicle.type !== "none" && (
        <SummaryLine
          icon={<MapPin className="h-3.5 w-3.5" />}
          label={vehicle.type === "selected" ? vehicle.vehicle.title : "Véhicule recommandé"}
          price={pricing.subtotals.vehicle}
          sub={`${vehicle.serviceType === "private" ? "Trajet privé" : vehicle.serviceType === "half_day" ? "½ journée" : vehicle.serviceType === "full_day" ? `${vehicle.days} jour${vehicle.days > 1 ? "s" : ""}` : `${vehicle.days} jours`}`}
        />
      )}

      {/* Expériences */}
      {experiences.length > 0 && experiences.map((exp) => (
        <SummaryLine key={exp.id} label={exp.title} sub={exp.date ? new Date(exp.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : undefined} />
      ))}

      {/* Services */}
      {services.length > 0 && services.map((svc) => (
        <SummaryLine key={svc.id} label={svc.label} price={svc.price} />
      ))}

      {/* Total */}
      {pricing.estimatedTotal > 0 && (
        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Estimation totale</p>
            <p className="text-base font-semibold text-gold">{formatPrice(pricing.estimatedTotal)}</p>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground/50">Montant estimatif — sous réserve de validation</p>
        </div>
      )}

      {pricing.estimatedTotal === 0 && (
        <p className="text-xs italic text-muted-foreground/50">Composez votre séjour pour voir le total estimatif.</p>
      )}
    </div>
  );
}

function SummaryLine({ icon, label, price, sub }: { icon?: React.ReactNode; label: string; price?: number; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <div className="flex items-start gap-2 min-w-0">
        {icon && <span className="mt-0.5 shrink-0 text-gold/60">{icon}</span>}
        <div className="min-w-0">
          <p className="truncate text-foreground">{label}</p>
          {sub && <p className="text-muted-foreground/60">{sub}</p>}
        </div>
      </div>
      {price != null && price > 0 && <span className="shrink-0 font-medium text-gold">{formatPrice(price)}</span>}
    </div>
  );
}
