"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Theme is applied to <html> server-side from a cookie (see layout.tsx), so the
// first paint already matches — no flash. The provider only handles the
// client-side toggle: flip the `.dark` class and persist the choice. We avoid
// router.refresh() here so switching is instant (purely a CSS class change).
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const apply = useCallback((next: Theme) => {
    setThemeState(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [apply, theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback so components used outside the provider still render.
    return { theme: "light", toggle: () => {}, setTheme: () => {} };
  }
  return ctx;
}
