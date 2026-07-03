import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "primary" && "bg-primary text-primary-foreground shadow-elevation-1 hover:bg-gold-light",
        variant === "secondary" && "border border-border bg-secondary text-secondary-foreground hover:border-primary/60 hover:bg-secondary",
        variant === "ghost" && "text-foreground hover:bg-gold/5",
        variant === "danger" && "bg-destructive text-white shadow-elevation-1 hover:bg-destructive/80",
        className,
      )}
      {...props}
    />
  );
}
