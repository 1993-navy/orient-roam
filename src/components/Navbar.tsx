"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/i18n";

// Compact top bar for mobile only. Desktop navigation lives in <Sidebar />.
export function Navbar() {
  const { data: session, status } = useSession();
  const { locale, setLocale, t } = useLang();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur md:hidden dark:border-white/10 dark:bg-neutral-950/85">
      <nav className="flex items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🧭</span>
          <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Orient&nbsp;Roam
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={t.search}
            aria-label={t.search}
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
          <Link
            href="/trips"
            className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={t.trips}
            aria-label={t.trips}
          >
            <Icon name="route" className="h-5 w-5" />
          </Link>
          <button
            onClick={toggle}
            className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-label="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="h-5 w-5" />
          </button>
          <button
            onClick={() => setLocale(locale === "en" ? "zh" : ("en" as Locale))}
            className="rounded-full border border-black/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-neutral-100 dark:border-white/15 dark:hover:bg-neutral-800"
            title="Switch language"
          >
            {locale === "en" ? "中文" : "EN"}
          </button>

          {status === "authenticated" && session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {t.signOut}
            </button>
          ) : (
            <Link
              href="/auth/signup"
              className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {t.signUp}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
