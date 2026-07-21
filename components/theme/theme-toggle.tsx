"use client";

import { Sun, Moon } from "lucide-react";
import { useYakoutTheme } from "@/components/providers/theme-provider";
import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeToggle() {
  const { theme, setTheme } = useYakoutTheme();
  const mounted = useHydrated();

  if (!mounted) {
    return (
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/50 text-muted-foreground transition"
        disabled
        aria-label="Chargement du thème"
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/50 text-muted-foreground transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-theme-spin" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-theme-spin" />
      )}
    </button>
  );
}
