"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

// X-style fixed top tab bar — the central section switcher (Home / Cities /
// Community). Sticks under the mobile Navbar (top-14) and at the very top on
// desktop. All links are soft client-side navigations (no full reload).
export function TopTabs() {
  const pathname = usePathname();
  const { t } = useLang();

  const tabs = [
    { href: "/", label: t.home },
    { href: "/cities", label: t.cities },
    { href: "/community", label: t.community },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="sticky top-14 z-10 border-b border-black/5 bg-white/85 backdrop-blur md:top-0 dark:border-white/10 dark:bg-black/85">
      <nav className="mx-auto flex max-w-2xl">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="group relative flex flex-1 items-center justify-center px-4 py-3.5 text-sm font-medium transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <span
                className={
                  active
                    ? "font-bold text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 dark:text-neutral-400"
                }
              >
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 h-1 w-12 rounded-full bg-rose-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
