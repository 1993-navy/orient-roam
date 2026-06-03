"use client";

import { useLang } from "@/components/LanguageProvider";
import type { UIStrings } from "@/lib/i18n";

// Tiny helper to render a translated UI string from a Server Component.
export function T({ k }: { k: keyof UIStrings }) {
  const { t } = useLang();
  return <>{t[k]}</>;
}
