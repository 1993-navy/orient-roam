"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider, type Theme } from "@/components/ThemeProvider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  initialLocale,
  initialTheme,
  children,
}: {
  initialLocale: Locale;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
