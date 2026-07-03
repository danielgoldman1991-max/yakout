"use client";

import { X } from "lucide-react";
import type { TransferItem } from "../types";
import { formatPrice } from "../price-calculator";

type Props = {
  transfers: TransferItem[];
  onAdd: (transfer: TransferItem) => void;
  onRemove: (id: string) => void;
};

const inputClass = "w-full rounded-sm border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-all duration-200 focus-visible:border-gold/40 focus-visible:ring-1 focus-visible:ring-gold/20";
const labelClass = "text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70";

const TRANSFER_OPTIONS = [
  { value: "none", label: "Aucun transfert nécessaire", price: 0, desc: "Je me déplace par mes propres moyens" },
  { value: "arrival", label: "Transfert arrivée aéroport", price: 250, desc: "Prise en charge à l'aéroport Marrakech" },
  { value: "departure", label: "Transfert départ aéroport", price: 250, desc: "Dépose à l'aéroport Marrakech" },
  { value: "both", label: "Aller-retour aéroport", price: 450, desc: "Arrivée + départ, économisez 50 MAD" },
  { value: "half_day", label: "Chauffeur à disposition (½ journée)", price: 500, desc: "4h de mise à disposition" },
  { value: "full_day", label: "Chauffeur à disposition (journée)", price: 900, desc: "8h de mise à disposition" },
  { value: "city_trip", label: "Trajet privé en ville", price: 200, desc: "Trajet simple en ville" },
];

function getTransferPrice(type: string): number {
  return TRANSFER_OPTIONS.find((o) => o.value === type)?.price ?? 0;
}

export function TransferSelectionStep({ transfers, onAdd, onRemove }: Props) {
  const hasSelection = transfers.length > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Arrivée à Marrakech</h2>
        <p className="text-sm text-muted-foreground/60">Besoin d&apos;un transfert ou d&apos;un chauffeur ?</p>
      </div>

      {!hasSelection && (
        <div className="grid gap-3 sm:grid-cols-2">
          {TRANSFER_OPTIONS.filter((o) => o.value !== "city_trip").map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === "none") return;
                const newTransfer: TransferItem = {
                  id: `transfer-${Date.now()}`,
                  type: opt.value as TransferItem["type"],
                  airport: "Marrakech (RAK)",
                  date: "",
                  time: "",
                  flightNumber: "",
                  luggageCount: 2,
                  dropoffAddress: "",
                };
                onAdd(newTransfer);
              }}
              className="group rounded-sm border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-glow-gold"
            >
              <p className="text-sm font-medium text-foreground group-hover:text-gold">{opt.label}</p>
              {opt.price > 0 && <p className="mt-0.5 text-xs text-gold">{formatPrice(opt.price)}</p>}
              <p className="mt-1 text-xs text-muted-foreground/60">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}

      {transfers.map((t) => (
        <div key={t.id} className="space-y-4 rounded-sm border border-border/50 bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{TRANSFER_OPTIONS.find((o) => o.value === t.type)?.label}</p>
              <p className="mt-0.5 text-xs text-gold">{formatPrice(getTransferPrice(t.type))}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
              aria-label="Supprimer ce transfert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClass}>Aéroport / lieu</label>
              <input type="text" className={inputClass} defaultValue={t.airport} placeholder="Marrakech (RAK)" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Adresse de destination</label>
              <input type="text" className={inputClass} defaultValue={t.dropoffAddress} placeholder="Hébergement ou lieu" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Date</label>
              <input type="date" className={inputClass} defaultValue={t.date} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Heure d&apos;arrivée</label>
              <input type="time" className={inputClass} defaultValue={t.time} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Numéro de vol (optionnel)</label>
              <input type="text" className={inputClass} defaultValue={t.flightNumber} placeholder="Ex: AF1234" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Bagages</label>
              <input type="number" min={0} className={inputClass} defaultValue={t.luggageCount} />
            </div>
          </div>
        </div>
      ))}

      {hasSelection && (
        <div className="flex flex-wrap gap-2">
          {TRANSFER_OPTIONS.filter((o) => o.value !== "none" && !transfers.some((t) => t.type === o.value)).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const newTransfer: TransferItem = {
                  id: `transfer-${Date.now()}`,
                  type: opt.value as TransferItem["type"],
                  airport: "Marrakech (RAK)",
                  date: "",
                  time: "",
                  flightNumber: "",
                  luggageCount: 2,
                  dropoffAddress: "",
                };
                onAdd(newTransfer);
              }}
              className="rounded-sm border border-border/40 bg-surface px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold/30 hover:text-gold"
            >
              + {opt.label}
            </button>
          ))}
        </div>
      )}

      {!hasSelection && (
        <div className="rounded-sm border border-border/30 bg-card/50 p-5 text-center">
          <p className="text-sm text-muted-foreground/60">Cliquez sur une option ci-dessus pour ajouter un transfert à votre séjour.</p>
        </div>
      )}
    </div>
  );
}
