import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { QuickNav } from "@/components/QuickNav";
import { CommandPalette } from "@/components/CommandPalette";
import { ServiceWorker } from "@/components/ServiceWorker";
import { THEME_COOKIE, type Theme } from "@/components/ThemeProvider";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
} from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Orient Roam — Wander China with confidence",
  description:
    "Where to eat, what to see, where to sleep in China — picked by travelers, ranked by real reviews, pinned on the map.",
  applicationName: "Orient Roam",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Orient Roam", statusBarStyle: "default" },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;
  // Theme is applied here (server-side) so the very first paint matches the
  // user's saved choice — no light/dark flash on load.
  const initialTheme: Theme =
    cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={initialLocale}
      className={`h-full antialiased ${initialTheme === "dark" ? "dark" : ""}`}
    >
      <body className="min-h-full bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
        <Providers initialLocale={initialLocale} initialTheme={initialTheme}>
          <div className="mx-auto flex min-h-screen max-w-7xl">
            <Sidebar />
            <div className="flex w-full min-w-0 flex-1 flex-col">
              <Navbar />
              <main className="flex-1 pb-20 md:pb-8">{children}</main>
              <footer className="border-t border-black/5 py-6 pb-24 text-center text-xs text-neutral-400 md:pb-6 dark:border-white/10">
                🧭 Orient Roam · A community guide for travelers in China
              </footer>
            </div>
          </div>
          <BottomNav />
          <QuickNav />
          <CommandPalette />
          <ServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
