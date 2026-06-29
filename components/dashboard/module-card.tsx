import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ModuleStatus = "Actif" | "À configurer" | "À venir" | "Désactivé";

const statusBadgeTone: Record<ModuleStatus, "gold" | "warning" | "muted"> = {
  Actif: "gold",
  "À configurer": "warning",
  "À venir": "muted",
  Désactivé: "muted",
};

export function ModuleCard({
  title,
  status,
  description,
  features,
  href,
  buttonLabel,
  icon: Icon,
  disabled,
  publicHref,
}: {
  title: string;
  status: ModuleStatus;
  description: string;
  features?: string[];
  href?: string;
  buttonLabel: string;
  icon: LucideIcon;
  disabled?: boolean;
  publicHref?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-3">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
            <Icon className="h-5 w-5 text-gold" />
          </div>
          <Badge tone={statusBadgeTone[status]}>{status}</Badge>
        </div>
        <h3 className="mt-5 font-display text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-auto p-6">
        {features && features.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <span key={feature} className="rounded-sm border border-border/50 bg-accent/5 px-2 py-0.5 text-[10px] text-muted-foreground/70">
                {feature}
              </span>
            ))}
          </div>
        )}
        {publicHref && status === "Actif" && (
          <div className="mb-3">
            <Link
              href={publicHref}
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-gold/70 transition hover:text-gold"
            >
              Voir sur le site →
            </Link>
          </div>
        )}
        {disabled || !href ? (
          <button
            disabled
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-border/50 bg-surface text-sm font-medium text-muted-foreground/40 transition cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        ) : (
          <Link
            href={href}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-gold text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
          >
            {buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
