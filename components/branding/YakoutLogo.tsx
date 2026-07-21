"use client";

import Image from "next/image";
import { useYakoutTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils/cn";
import { useHydrated } from "@/hooks/use-hydrated";

type YakoutLogoVariant = "light" | "dark" | "auto";
type YakoutLogoSize = "sm" | "md" | "lg";

type YakoutLogoProps = {
  variant?: YakoutLogoVariant;
  size?: YakoutLogoSize;
  iconOnly?: boolean;
  priority?: boolean;
  className?: string;
};

const wordmarkSizes: Record<YakoutLogoSize, { width: number; height: number }> = {
  sm: { width: 145, height: 35 },
  md: { width: 166, height: 40 },
  lg: { width: 190, height: 46 },
};

const iconSizes: Record<YakoutLogoSize, number> = {
  sm: 34,
  md: 40,
  lg: 46,
};

export function YakoutLogo({
  variant = "auto",
  size = "md",
  iconOnly = false,
  priority = false,
  className,
}: YakoutLogoProps) {
  const { theme } = useYakoutTheme();
  const mounted = useHydrated();
  const dimensions = iconOnly
    ? { width: iconSizes[size], height: iconSizes[size] }
    : wordmarkSizes[size];

  if (variant === "auto" && !mounted) {
    return <span aria-hidden="true" className={cn("inline-block shrink-0", className)} style={dimensions} />;
  }

  const resolvedVariant = variant === "auto" ? theme : variant;
  const src = iconOnly ? "/branding/yakout-icon.png" : `/branding/yakout-logo-${resolvedVariant}.png`;

  return (
    <Image
      src={src}
      alt="Yakout Conciergerie et Services"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      sizes={`${dimensions.width}px`}
      className={cn("h-auto shrink-0 object-contain", className)}
    />
  );
}
