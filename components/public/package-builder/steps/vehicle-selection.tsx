"use client";

import { Car, Sparkles } from "lucide-react";
import type { VehicleOption, VehicleSelection as VehSel } from "../types";
import { SelectionCard, SelectionRadioCard, CountSelector } from "../selection-card";
import { formatPrice } from "../price-calculator";

type Props = {
  vehicles: VehSel[];
  value: VehicleOption;
  onChange: (value: VehicleOption) => void;
};

const VEHICLE_SERVICE_TYPES: { value: "private" | "half_day" | "full_day" | "multi_day"; label: string; desc: string }[] = [
  { value: "private", label: "Trajet privé", desc: "Un trajet ponctuel" },
  { value: "half_day", label: "Demi-journée", desc: "Jusqu'à 4h" },
  { value: "full_day", label: "Journée complète", desc: "Jusqu'à 8h" },
  { value: "multi_day", label: "Plusieurs jours", desc: "Mise à disposition" },
];

export function VehicleSelectionStep({ vehicles, value, onChange }: Props) {
  const svcType = value.type !== "none" ? value.serviceType : "private";
  const days = value.type !== "none" ? value.days : 1;

  const setServiceType = (st: typeof svcType) => {
    if (value.type === "selected") onChange({ ...value, serviceType: st });
    else if (value.type === "recommendation") onChange({ ...value, serviceType: st });
    else onChange({ type: "recommendation", serviceType: st, days: 1 });
  };

  const setDays = (d: number) => {
    if (value.type === "selected") onChange({ ...value, days: d });
    else if (value.type === "recommendation") onChange({ ...value, days: d });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Véhicule & chauffeur</h2>
        <p className="text-sm text-muted-foreground/60">Choisissez votre solution mobilité premium.</p>
      </div>

      <div className="space-y-2.5">
        <SelectionRadioCard
          label="Aucun véhicule nécessaire"
          description="Je n'ai pas besoin de chauffeur ou véhicule"
          selected={value.type === "none"}
          onSelect={() => onChange({ type: "none" })}
        />
        <SelectionRadioCard
          label="Je veux qu'on me propose le meilleur véhicule"
          description="Nous sélectionnons le véhicule le plus adapté à votre séjour"
          selected={value.type === "recommendation"}
          onSelect={() => onChange({ type: "recommendation", serviceType: "full_day", days: 1 })}
        />
      </div>

      {vehicles.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">Nos véhicules disponibles</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((veh) => {
              const isSelected = value.type === "selected" && value.vehicle.id === veh.id;
              const price = veh.priceTransfer || veh.priceHalfDay || veh.priceFullDay || 0;
              return (
                <SelectionCard
                  key={veh.id}
                  imageUrl={veh.imageUrl}
                  title={veh.title}
                  subtitle={`${veh.capacity} pers. max`}
                  price={formatPrice(price)}
                  selected={isSelected}
                  onSelect={() => onChange({ type: "selected", vehicle: veh, serviceType: svcType, days })}
                />
              );
            })}
          </div>
        </div>
      )}

      {value.type !== "none" && (
        <div className="space-y-5 rounded-sm border border-border/40 bg-card p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">Type de prestation</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {VEHICLE_SERVICE_TYPES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setServiceType(st.value)}
                className={`rounded-sm border px-4 py-3 text-left transition-all duration-200 ${
                  svcType === st.value
                    ? "border-gold bg-gold/10 shadow-glow-gold"
                    : "border-border/40 bg-surface hover:border-gold/30"
                }`}
              >
                <p className={`text-sm font-medium ${svcType === st.value ? "text-gold" : "text-foreground"}`}>{st.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">{st.desc}</p>
              </button>
            ))}
          </div>
          {svcType === "multi_day" && (
            <div className="max-w-xs">
              <CountSelector label="Nombre de jours" value={days} onChange={setDays} min={1} max={30} />
            </div>
          )}
        </div>
      )}

      {value.type === "recommendation" && (
        <div className="flex items-center gap-3 rounded-sm border border-gold/15 bg-gold/5 px-5 py-4">
          <Sparkles className="h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-muted-foreground">
            Nous vous recommanderons le véhicule idéal selon votre séjour et le nombre de voyageurs.
          </p>
        </div>
      )}

      {vehicles.length === 0 && value.type === "none" && (
        <div className="flex flex-col items-center gap-3 rounded-sm border border-border/30 bg-card p-10 text-center">
          <Car className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">Aucun véhicule disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}
