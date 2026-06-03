"use client";

import Link from "next/link";
import { AmapMap } from "@/components/AmapMap";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { useLang } from "@/components/LanguageProvider";
import { categoryLabel, localizedName, CATEGORY_LABELS } from "@/lib/i18n";
import { PLACE_CATEGORIES } from "@/lib/validations";

type ExplorePlace = PlaceCardData & { lng: number; lat: number };

export function ExploreView({
  cities,
  currentCity,
  currentCategory,
  center,
  mapZoom,
  places,
}: {
  cities: { id: string; name: string; nameEn: string }[];
  currentCity?: string;
  currentCategory?: string;
  center: { lng: number; lat: number };
  mapZoom: number;
  places: ExplorePlace[];
}) {
  const { locale, t } = useLang();

  function buildHref(next: { city?: string | null; category?: string | null }) {
    const params = new URLSearchParams();
    const city = next.city === undefined ? currentCity : next.city;
    const category = next.category === undefined ? currentCategory : next.category;
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `/explore?${qs}` : "/explore";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t.explore}</h1>

      {/* City filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip href={buildHref({ city: null })} active={!currentCity}>
          🌏 {t.allCategories}
        </Chip>
        {cities.map((c) => (
          <Chip key={c.id} href={buildHref({ city: c.id })} active={currentCity === c.id}>
            {localizedName(c, locale)}
          </Chip>
        ))}
      </div>

      {/* Category filter */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip href={buildHref({ category: null })} active={!currentCategory}>
          {t.allCategories}
        </Chip>
        {PLACE_CATEGORIES.map((cat) => (
          <Chip key={cat} href={buildHref({ category: cat })} active={currentCategory === cat}>
            {CATEGORY_LABELS[cat]?.emoji} {categoryLabel(cat, locale)}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-20">
            <AmapMap
              center={center}
              zoom={mapZoom}
              height={480}
              markers={places.map((p) => ({
                id: p.id,
                name: localizedName(p, locale),
                lng: p.lng,
                lat: p.lat,
                category: p.category,
                rating: p.avgRating,
              }))}
            />
          </div>
        </div>

        <div className="space-y-3 lg:order-1">
          <p className="text-sm text-neutral-500">
            {places.length} {t.topPicks.toLowerCase()} ·{" "}
            <span className="text-neutral-400">ranked by review weight</span>
          </p>
          {places.length === 0 ? (
            <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
              No places yet.
            </p>
          ) : (
            places.map((p, i) => <PlaceCard key={p.id} place={p} rank={i + 1} />)
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-rose-600 text-white"
          : "border border-black/10 bg-white hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </Link>
  );
}
