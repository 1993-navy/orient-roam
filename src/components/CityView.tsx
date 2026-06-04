"use client";

import Link from "next/link";
import { AmapMap } from "@/components/AmapMap";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { useLang } from "@/components/LanguageProvider";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { categoryLabel, localizedName, CATEGORY_LABELS } from "@/lib/i18n";
import { PLACE_CATEGORIES } from "@/lib/validations";

type CityPlace = PlaceCardData & { lng: number; lat: number };

export function CityView({
  city,
  initialPlaces,
  initialHasMore,
}: {
  city: { id: string; name: string; nameEn: string; province: string; summary: string | null; lng: number; lat: number };
  initialPlaces: CityPlace[];
  initialHasMore: boolean;
}) {
  const { locale, t } = useLang();

  const { items, hasMore, loading, sentinelRef } = useInfiniteList<CityPlace>({
    endpoint: "/api/places",
    query: `city=${city.id}`,
    initial: { items: initialPlaces, hasMore: initialHasMore },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/cities" className="text-sm text-neutral-500 hover:text-rose-600">
        ← {t.cities}
      </Link>
      <div className="mt-2">
        <h1 className="text-3xl font-extrabold">{localizedName(city, locale)}</h1>
        <p className="text-sm text-neutral-400">{city.province}</p>
        {city.summary && (
          <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-300">{city.summary}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/explore?city=${city.id}&category=${cat}`}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            {CATEGORY_LABELS[cat]?.emoji} {categoryLabel(cat, locale)}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <AmapMap
          center={{ lng: city.lng, lat: city.lat }}
          zoom={11}
          height={360}
          markers={items.map((p) => ({
            id: p.id,
            name: localizedName(p, locale),
            lng: p.lng,
            lat: p.lat,
            category: p.category,
            rating: p.avgRating,
          }))}
        />
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">⭐ {t.topPicks}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((p, i) => (
            <PlaceCard key={p.id} place={p} rank={i + 1} />
          ))}
        </div>
        <div ref={sentinelRef} className="py-4 text-center text-sm text-neutral-400">
          {loading
            ? t.loadingMore
            : !hasMore && items.length > 0
              ? t.endOfList
              : ""}
        </div>
      </section>
    </div>
  );
}
