"use client";

import { Check, Sparkles } from "lucide-react";
import type { ExtraService } from "../types";
import { EXTRA_SERVICE_OPTIONS } from "../types";
import { formatPrice } from "../price-calculator";

type Props = {
  selected: ExtraService[];
  onAdd: (svc: ExtraService) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, details: string) => void;
};

export function ExtraServicesStep({ selected, onAdd, onRemove, onUpdate }: Props) {
  const selectedIds = new Set(selected.map((s) => s.id));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Services complémentaires</h2>
        <p className="text-sm text-muted-foreground/60">Personnalisez votre séjour avec nos services sur mesure.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXTRA_SERVICE_OPTIONS.map((svc) => {
          const isSelected = selectedIds.has(svc.id);
          const sel = selected.find((s) => s.id === svc.id);
          return (
            <div
              key={svc.id}
              className={`group cursor-pointer rounded-sm border p-4 transition-all duration-200 ${
                isSelected
                  ? "border-gold bg-gold/5 shadow-glow-gold"
                  : "border-border/60 bg-card hover:border-gold/30 hover:shadow-glow-gold"
              }`}
              onClick={() => isSelected ? onRemove(svc.id) : onAdd({ ...svc, details: "" })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (isSelected) { onRemove(svc.id); } else { onAdd({ ...svc, details: "" }); } } }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition ${
                      isSelected ? "border-gold bg-gold" : "border-border/60"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <p className={`text-sm font-medium transition ${isSelected ? "text-gold" : "text-foreground"}`}>{svc.label}</p>
                  </div>
                  {svc.price > 0 && (
                    <p className="mt-1.5 text-xs text-gold">{formatPrice(svc.price)}</p>
                  )}
                  {svc.price === 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground/50">Sur devis / gratuit</p>
                  )}
                </div>
                <Sparkles className={`h-4 w-4 shrink-0 transition ${isSelected ? "text-gold" : "text-muted-foreground/20"}`} />
              </div>
              {isSelected && (svc.id === "decoration" || svc.id === "groceries" || svc.id === "restaurant") && (
                <div className="mt-3 pl-7">
                  <input
                    type="text"
                    value={sel?.details || ""}
                    onChange={(e) => { e.stopPropagation(); onUpdate(svc.id, e.target.value); }}
                    placeholder={
                      svc.id === "decoration" ? "Quelle occasion ? (anniversaire, lune de miel...)" :
                      svc.id === "groceries" ? "Que souhaitez-vous dans vos courses ?" :
                      "Type de cuisine, date, nombre de personnes..."
                    }
                    className="w-full rounded-sm border border-border/40 bg-surface px-3 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/40 focus-visible:border-gold/40 focus-visible:ring-1 focus-visible:ring-gold/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-gold">{selected.length} service{selected.length > 1 ? "s" : ""}</span>
            {" "}ajouté{selected.length > 1 ? "s" : ""} à votre séjour
          </p>
        </div>
      )}
    </div>
  );
}
