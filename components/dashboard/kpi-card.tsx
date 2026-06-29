import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/15 hover:shadow-elevation-3">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">{title}</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground truncate">{value}</p>
            {trend && (
              <p className={cn(
                "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-emerald-400" : "text-ruby-light"
              )}>
                <span className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  trend.positive ? "bg-emerald-400" : "bg-ruby-light"
                )} />
                {trend.value}
              </p>
            )}
          </div>
          <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gold/15 bg-gold/5">
            <Icon className="h-4 w-4 text-gold" />
          </div>
        </div>
        {description && (
          <p className="mt-4 text-xs text-muted-foreground/60 border-t border-border/40 pt-3">{description}</p>
        )}
      </div>
    </div>
  );
}
