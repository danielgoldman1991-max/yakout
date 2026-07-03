"use client";

import { ChevronRight, Home, Sparkles } from "lucide-react";
import type { ApartmentOption, ApartmentSelection as AptSel } from "../types";
import { SelectionCard, SelectionRadioCard } from "../selection-card";
import { formatPrice } from "../price-calculator";

type Props = {
  apartments: AptSel[];
  value: ApartmentOption;
  nights: number;
  onChange: (value: ApartmentOption) => void;
};

export function ApartmentSelectionStep({ apartments, value, nights, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-foreground">Où séjourner à Marrakech ?</h2>
        <p className="text-sm text-muted-foreground/60">Choisissez parmi nos appartements disponibles ou laissez-nous vous conseiller.</p>
      </div>

      <div className="space-y-2.5">
        <SelectionRadioCard
          label="Je veux qu'on me propose le meilleur hébergement"
          description="Nous sélectionnons l'appartement idéal selon votre budget et vos envies"
          selected={value.type === "recommendation"}
          onSelect={() => onChange({ type: "recommendation" })}
        />
        <SelectionRadioCard
          label="Aucun hébergement nécessaire"
          description="J'ai déjà mon logement sur place"
          selected={value.type === "none"}
          onSelect={() => onChange({ type: "none" })}
        />
        <SelectionRadioCard
          label="Choisir un appartement"
          description="Parcourez notre sélection et choisissez vous-même"
          selected={value.type === "selected"}
          onSelect={() => { if (apartments.length > 0) onChange({ type: "selected", apartment: apartments[0] }); }}
        />
      </div>

      {(value.type === "selected" || apartments.length > 0) && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => {
            const isSelected = value.type === "selected" && value.apartment.id === apt.id;
            const totalPrice = apt.pricePerNight * nights;
            return (
              <SelectionCard
                key={apt.id}
                imageUrl={apt.imageUrl}
                title={apt.title}
                subtitle={`${apt.district} · ${apt.bedrooms} ch. · ${apt.capacity} pers. max`}
                price={nights > 0 ? `${formatPrice(totalPrice)} total` : `À partir de ${formatPrice(apt.pricePerNight)}/nuit`}
                badge={apt.bedrooms <= 1 && apt.capacity <= 2 ? "Idéal couple" : apt.bedrooms >= 3 ? "Idéal famille" : undefined}
                selected={isSelected}
                onSelect={() => onChange({ type: "selected", apartment: apt })}
              />
            );
          })}
          {apartments.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-sm border border-border/30 bg-card p-10 text-center">
              <Home className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">Aucun appartement disponible</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Laissez-nous vous proposer les meilleures options.</p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ type: "recommendation" })}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold transition hover:text-gold-light"
              >
                Proposez-moi <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {value.type === "recommendation" && (
        <div className="flex items-center gap-3 rounded-sm border border-gold/15 bg-gold/5 px-5 py-4">
          <Sparkles className="h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-muted-foreground">
            Nous vous proposerons l&apos;hébergement idéal selon vos critères. Notre équipe vous contactera avec des suggestions personnalisées.
          </p>
        </div>
      )}
    </div>
  );
}
