import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
};

export function Button({ className, variant = "primary", size = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "default" && "h-10 px-4",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-12 px-6",
        size === "icon" && "size-10",
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
