"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

// Compact top bar for mobile only. Desktop navigation lives in <Sidebar />.
export function Navbar() {
  const { data: session, status } = useSession();
  const { locale, setLocale, t } = useLang();

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
