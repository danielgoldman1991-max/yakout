"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "yakout-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme(nextTheme) {
      setThemeState(nextTheme);
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    },
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useYakoutTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useYakoutTheme doit etre utilise dans ThemeProvider.");
  }
  return context;
}
