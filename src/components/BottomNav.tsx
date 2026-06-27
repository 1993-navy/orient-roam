"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Icon, type IconName } from "@/components/Icon";

// X-style bottom tab bar, mobile only. Leads with the three primary
// destinations (Home / Cities / Community); Chat rounds out the row.
// (Explore is reachable via the search icon in the top Navbar.)
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();

  const tabs: { href: string; icon: IconName; label: string }[] = [
    { href: "/", icon: "home", label: t.home },
    { href: "/meetups", icon: "meetup", label: t.meetupsNav },
    { href: "/community", icon: "community", label: t.community },
    { href: "/chat", icon: "chat", label: t.chat },
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
                <Icon
                  name={tab.icon}
                  className={`h-6 w-6 ${active ? "scale-110" : ""} transition`}
                  filled={active}
                  strokeWidth={active ? 2.1 : 1.8}
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
