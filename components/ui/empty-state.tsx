import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
          <Icon className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <h3 className="mt-5 font-display text-lg text-muted-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground/50">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
