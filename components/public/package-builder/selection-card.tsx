"use client";

import { Check, Plus, Sparkles } from "lucide-react";

type Props = {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: string;
  badge?: string;
  selected?: boolean;
  onSelect?: () => void;
  onDetail?: () => void;
};

export function SelectionCard({ imageUrl, title, subtitle, description, price, badge, selected, onSelect, onDetail }: Props) {
  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-sm border transition-all duration-300 hover:-translate-y-0.5 ${
        selected
          ? "border-gold bg-gold/5 shadow-glow-gold"
          : "border-border/60 bg-card hover:border-gold/30 hover:shadow-glow-gold hover:bg-gold/[0.02]"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      aria-pressed={selected}
    >
      {imageUrl ? (
        <div className="relative h-40 w-full overflow-hidden sm:h-48">
          <img src={imageUrl} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {badge && <span className="absolute left-3 top-3 rounded-sm bg-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">{badge}</span>}
          {selected && (
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gold shadow-glow-gold">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {price && <span className="absolute bottom-3 right-3 rounded-sm bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">{price}</span>}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center bg-surface sm:h-40">
          <Sparkles className="h-8 w-8 text-muted-foreground/30" />
          {badge && <span className="absolute left-3 top-3 rounded-sm bg-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">{badge}</span>}
          {selected && (
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gold shadow-glow-gold">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {price && <span className="absolute bottom-3 right-3 rounded-sm bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">{price}</span>}
        </div>
      )}
      <div className="space-y-1 p-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
        {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{description}</p>}
        {onDetail && (
          <button
            onClick={(e) => { e.stopPropagation(); onDetail(); }}
            className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gold transition hover:text-gold-light"
          >
            Voir détails
          </button>
        )}
        {onSelect && !selected && (
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold transition group-hover:translate-x-0.5">
            <Plus className="h-3.5 w-3.5" />
            {badge === "Ajouté" ? "Retirer" : "Ajouter à mon séjour"}
          </div>
        )}
      </div>
    </div>
  );
}

export function SelectionRadioCard({
  label,
  description,
  selected,
  onSelect,
  value,
  name,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect?: () => void;
  value?: string;
  name?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition-all duration-200 ${
        selected ? "border-gold bg-gold/5 shadow-glow-gold" : "border-border/60 bg-card hover:border-gold/30"
      }`}
      onClick={onSelect}
    >
      <input type="radio" name={name} value={value} checked={selected} onChange={() => {}} className="mt-0.5 accent-gold" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>}
      </div>
    </label>
  );
}

export function CountSelector({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-border/60 bg-card px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-border/60 text-foreground transition hover:border-gold/40 hover:bg-gold/10 disabled:pointer-events-none disabled:opacity-30"
          aria-label={`Diminuer ${label}`}
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-foreground">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-border/60 text-foreground transition hover:border-gold/40 hover:bg-gold/10 disabled:pointer-events-none disabled:opacity-30"
          aria-label={`Augmenter ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
