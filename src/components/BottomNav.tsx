"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

// X-style bottom tab bar, mobile only. Four destinations, one of them Chat.
export function BottomNav() {
  const pathname = usePathname();
  const { locale, t } = useLang();

  const tabs = [
    { href: "/", icon: "🧭", label: locale === "zh" ? "首页" : "Home" },
    { href: "/explore", icon: "🗺️", label: t.explore },
    { href: "/community", icon: "🤝", label: t.community },
    { href: "/chat", icon: "💬", label: t.chat },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 backdrop-blur md:hidden dark:border-white/10 dark:bg-neutral-950/95">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  active ? "text-rose-600" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <span className={`text-xl leading-none ${active ? "scale-110" : ""} transition`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
