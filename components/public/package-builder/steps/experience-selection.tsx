"use client";

import { Mountain, X } from "lucide-react";
import type { ExperienceItem } from "../types";
import { SelectionCard } from "../selection-card";
import { formatPrice } from "../price-calculator";

type Props = {
  experiences: ExperienceItem[];
  selected: ExperienceItem[];
  onAdd: (exp: ExperienceItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: { date: string; people: number }) => void;
  adults: number;
  childCount: number;
};

const inputClass = "w-full rounded-sm border border-border/60 bg-surface px-3 py-2 text-xs text-foreground outline-none transition-all duration-200 focus-visible:border-gold/40 focus-visible:ring-1 focus-visible:ring-gold/20";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70";

export function ExperienceSelectionStep({ experiences, selected, onAdd, onRemove, onUpdate, adults, childCount }: Props) {
  const selectedIds = new Set(selected.map((e) => e.id));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Expériences & circuits</h2>
        <p className="text-sm text-muted-foreground/60">Composez votre séjour avec nos expériences incontournables.</p>
      </div>

      {experiences.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-sm border border-border/30 bg-card p-10 text-center">
          <Mountain className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-foreground">Aucune expérience disponible</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Nos circuits et excursions seront bientôt disponibles.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => {
            const isSelected = selectedIds.has(exp.id);
            const sel = selected.find((e) => e.id === exp.id);
            return (
              <div key={exp.id}>
                <SelectionCard
                  imageUrl={exp.imageUrl}
                  title={exp.title}
                  subtitle={exp.destination ? `${exp.destination} · ${exp.durationLabel || "Excursion"}` : exp.durationLabel}
                  price={formatPrice(exp.price)}
                  selected={isSelected}
                  onSelect={() => isSelected ? onRemove(exp.id) : onAdd({ ...exp, date: "", people: adults + childCount })}
                />
                {isSelected && (
                  <div className="mt-2 space-y-2 rounded-sm border border-border/30 bg-surface p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className={labelClass}>Date</label>
                        <input type="date" value={sel?.date || ""} onChange={(e) => onUpdate(exp.id, { date: e.target.value, people: sel?.people || adults + childCount })} className={inputClass} />
                      </div>
                      <div className="space-y-0.5">
                        <label className={labelClass}>Personnes</label>
                        <input type="number" min={1} value={sel?.people || adults + childCount} onChange={(e) => onUpdate(exp.id, { date: sel?.date || "", people: Number(e.target.value) || 1 })} className={inputClass} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(exp.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-sm border border-destructive/20 py-1 text-[10px] font-semibold uppercase tracking-wider text-ruby-light transition hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" /> Retirer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-gold">{selected.length} expérience{selected.length > 1 ? "s" : ""}</span>
            {" "}sélectionnée{selected.length > 1 ? "s" : ""} pour votre séjour
          </p>
        </div>
      )}
    </div>
  );
}
