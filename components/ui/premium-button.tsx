import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

export function PremiumButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  [key: string]: unknown;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.1em] transition-all duration-300";

  const variants: Record<Variant, string> = {
    primary:
      "bg-gold text-primary-foreground shadow-elevation-2 shadow-gold/20 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light active:translate-y-0",
    secondary:
      "bg-ruby text-white shadow-elevation-2 shadow-ruby/20 hover:-translate-y-0.5 hover:shadow-glow-ruby hover:bg-ruby-light active:translate-y-0",
    outline:
      "border border-border text-muted-foreground shadow-elevation-1 hover:-translate-y-0.5 hover:border-gold/30 hover:text-foreground hover:bg-gold/5 hover:shadow-elevation-2 active:translate-y-0",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-gold/5",
    whatsapp:
      "bg-[#25D366] text-white shadow-elevation-2 shadow-[#25D366]/20 hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-lg active:translate-y-0",
  };

  const sizes: Record<Size, string> = {
    sm: "px-5 py-2 text-[10px] rounded-sm",
    md: "px-7 py-3 text-[11px] rounded-sm",
    lg: "px-9 py-4 text-[12px] rounded-sm",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }

  return <button className={classes} {...props}>{children}</button>;
}
