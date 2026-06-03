"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={initialLocale}>
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
