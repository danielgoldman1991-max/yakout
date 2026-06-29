import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "ruby" | "muted" | "success" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tone === "gold" && "border-gold/20 bg-gold/8 text-gold",
        tone === "ruby" && "border-ruby/25 bg-ruby/12 text-ruby-light",
        tone === "muted" && "border-border bg-card text-muted-foreground/60",
        tone === "success" && "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
        tone === "warning" && "border-amber-400/20 bg-amber-400/8 text-amber-300",
        tone === "info" && "border-sky-400/20 bg-sky-400/8 text-sky-300",
        tone === "default" && "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
