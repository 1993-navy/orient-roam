"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { useLang } from "@/components/LanguageProvider";

// Floating quick-nav rail on the right edge (wide screens only). Soft links to
// the three primary sections plus a smooth scroll-to-top. Glassy + rounded to
// match the X-like chrome.
export function QuickNav() {
  const { t } = useLang();

  const jumps: { href: string; icon: IconName; label: string }[] = [
    { href: "/", icon: "home", label: t.home },
    { href: "/cities", icon: "city", label: t.cities },
    { href: "/community", icon: "community", label: t.community },
  ];

  return (
    <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-full border border-black/10 bg-white/80 p-1.5 shadow-lg backdrop-blur xl:flex dark:border-white/15 dark:bg-neutral-900/80">
      {jumps.map((j) => (
        <Link
          key={j.href}
          href={j.href}
          title={j.label}
          aria-label={j.label}
          className="rounded-full p-2.5 text-neutral-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Icon name={j.icon} className="h-5 w-5" />
        </Link>
      ))}
      <div className="mx-2 border-t border-black/5 dark:border-white/10" />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title={t.backToTop}
        aria-label={t.backToTop}
        className="rounded-full p-2.5 text-neutral-600 transition hover:bg-rose-50 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Icon name="arrowUp" className="h-5 w-5" />
      </button>
    </div>
  );
}
