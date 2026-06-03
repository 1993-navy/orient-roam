"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-neutral-900 dark:text-rose-300">
            🧭 Orient Roam
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t.tagline}
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
            {t.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700"
            >
              {t.explore} →
            </Link>
            <Link
              href="/cities"
              className="rounded-full border border-black/10 bg-white px-6 py-3 font-semibold transition hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              {t.chooseCity}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
