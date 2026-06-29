"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { site } from "@/lib/constants/site";
import { useYakoutTheme } from "@/components/providers/theme-provider";

const noopSubscribe = () => () => {};

export function YakoutLogo({
  width = 140,
  height = 43,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const { theme } = useYakoutTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <Image
      src={site.logo}
      alt={site.companyName}
      width={width}
      height={height}
      className={`object-contain transition-opacity duration-300 ${className ?? ""} ${!isDark ? "brightness-[0.85]" : ""}`}
      priority
    />
  );
}
