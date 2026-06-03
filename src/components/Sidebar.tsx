"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

// X-style left navigation rail, shown on desktop (md and up).
export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { locale, setLocale, t } = useLang();

  const items = [
    { href: "/", icon: "🧭", label: locale === "zh" ? "首页" : "Home" },
    { href: "/explore", icon: "🗺️", label: t.explore },
    { href: "/cities", icon: "🏙️", label: t.cities },
    { href: "/community", icon: "🤝", label: t.community },
    { href: "/chat", icon: "💬", label: t.chat },
  ];
  if (status === "authenticated" && session?.user) {
    items.push({ href: `/profile/${session.user.id}`, icon: "👤", label: locale === "zh" ? "我的" : "Profile" });
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[88px] flex-col gap-1 border-r border-black/10 px-2 py-3 md:flex lg:w-64 lg:px-3 dark:border-white/10">
      <Link href="/" className="mb-2 flex items-center gap-2 rounded-full px-3 py-2 text-xl font-bold">
        <span>🧭</span>
        <span className="hidden bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent lg:inline">
          Orient&nbsp;Roam
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-4 rounded-full px-3 py-2.5 text-lg transition hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                active ? "font-bold" : "font-normal"
              }`}
            >
              <span className={`text-2xl ${active ? "scale-110" : ""}`}>{it.icon}</span>
              <span className={`hidden lg:inline ${active ? "text-rose-600" : ""}`}>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      {status !== "authenticated" && (
        <Link
          href="/auth/signup"
          className="mt-2 flex items-center justify-center rounded-full bg-rose-600 px-3 py-3 font-semibold text-white transition hover:bg-rose-700"
        >
          <span className="lg:hidden">＋</span>
          <span className="hidden lg:inline">{t.signUp}</span>
        </Link>
      )}

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={() => setLocale(locale === "en" ? "zh" : ("en" as Locale))}
          className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900"
          title="Switch language"
        >
          <span className="text-xl">🌐</span>
          <span className="hidden lg:inline">{locale === "en" ? "中文" : "English"}</span>
        </button>

        {status === "authenticated" && session?.user ? (
          <div className="flex items-center gap-2 rounded-full px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <Link
              href={`/profile/${session.user.id}`}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 font-bold dark:from-neutral-800 dark:to-neutral-800">
                {(session.user.name ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 truncate text-sm font-medium lg:inline">
                {session.user.name}
              </span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hidden text-xs text-neutral-400 hover:text-rose-600 lg:inline"
              title={t.signOut}
            >
              {t.signOut}
            </button>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <span className="text-xl">🔑</span>
            <span className="hidden lg:inline">{t.signIn}</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
