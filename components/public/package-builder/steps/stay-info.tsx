"use client";

import type { StayInfo } from "../types";
import { TRIP_STYLE_OPTIONS, OBJECTIVE_OPTIONS, nightsBetween } from "../types";
import { CountSelector } from "../selection-card";

type Props = {
  stay: StayInfo;
  onChange: (stay: StayInfo) => void;
};

const inputClass = "w-full rounded-sm border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all duration-200 focus-visible:border-gold/40 focus-visible:ring-1 focus-visible:ring-gold/20";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70";

export function StayInfoStep({ stay, onChange }: Props) {
  const update = (patch: Partial<StayInfo>) => {
    const next = { ...stay, ...patch };
    if ("arrivalDate" in patch || "departureDate" in patch) {
      next.nights = nightsBetween(next.arrivalDate, next.departureDate);
    }
    onChange(next);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Quand souhaitez-vous venir ?</h2>
        <p className="text-sm text-muted-foreground/60">Choisissez vos dates et le nombre de voyageurs.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelClass}>Date d&apos;arrivée</label>
          <input type="date" value={stay.arrivalDate} onChange={(e) => update({ arrivalDate: e.target.value })} className={inputClass} min={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Date de départ</label>
          <input type="date" value={stay.departureDate} onChange={(e) => update({ departureDate: e.target.value })} className={inputClass} min={stay.arrivalDate || new Date().toISOString().slice(0, 10)} />
        </div>
      </div>

      {stay.nights > 0 && (
        <div className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3 text-center text-sm">
          <span className="font-semibold text-gold">{stay.nights} nuit{stay.nights > 1 ? "s" : ""}</span>
          <span className="text-muted-foreground/70"> de séjour</span>
        </div>
      )}

      <div className="space-y-3">
        <p className={labelClass}>Voyageurs</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <CountSelector label="Adultes" value={stay.adults} onChange={(v) => update({ adults: v })} min={1} max={20} />
          <CountSelector label="Enfants" value={stay.children} onChange={(v) => update({ children: v })} min={0} max={10} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Ville / pays d&apos;origine</label>
        <input type="text" value={stay.origin} onChange={(e) => update({ origin: e.target.value })} className={inputClass} placeholder="Ex: Paris, France" />
      </div>

      <div className="space-y-3">
        <p className={labelClass}>Type de séjour</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TRIP_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ tripStyle: opt.value })}
              className={`flex items-center gap-2 rounded-sm border px-3 py-2.5 text-sm transition-all duration-200 ${
                stay.tripStyle === opt.value
                  ? "border-gold bg-gold/10 text-gold shadow-glow-gold"
                  : "border-border/60 bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground"
              }`}
            >
              <span className="text-base">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className={labelClass}>Objectif principal du séjour</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OBJECTIVE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ objective: opt.value })}
              className={`rounded-sm border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                stay.objective === opt.value
                  ? "border-gold bg-gold/10 text-gold shadow-glow-gold"
                  : "border-border/60 bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Budget estimatif global (MAD)</label>
        <input type="number" value={stay.budget || ""} onChange={(e) => update({ budget: Number(e.target.value) || 0 })} className={inputClass} placeholder="Ex: 15000" min={0} step={1000} />
      </div>
    </div>
  );
}
