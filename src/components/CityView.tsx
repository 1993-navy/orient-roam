"use client";

import Link from "next/link";
import { CityMediaGallery, type CityMediaItem } from "@/components/CityMediaGallery";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { CityCultureView } from "@/components/CityCultureView";
import { useLang } from "@/components/LanguageProvider";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { FeedFooter } from "@/components/FeedFooter";
import { categoryLabel, localizedName, CATEGORY_LABELS } from "@/lib/i18n";
import { PLACE_CATEGORIES } from "@/lib/validations";

type CityPlace = PlaceCardData & { lng: number; lat: number };

export function CityView({
  city,
  media,
  initialPlaces,
  initialHasMore,
}: {
  city: {
    id: string;
    name: string;
    nameEn: string;
    province: string;
    summary: string | null;
    lng: number;
    lat: number;
    coverImage: string | null;
    history: string | null;
    historyEn: string | null;
    culture: string | null;
    cultureEn: string | null;
    cuisine: string | null;
    cuisineEn: string | null;
    landmarks: string | null;
    landmarksEn: string | null;
    stories: string | null;
    storiesEn: string | null;
  };
  media: CityMediaItem[];
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

      <CityMediaGallery
        media={media}
        fallbackCover={city.coverImage}
        cityName={localizedName(city, locale)}
      />

      <CityCultureView
        data={{
          history: city.history,
          historyEn: city.historyEn,
          culture: city.culture,
          cultureEn: city.cultureEn,
          cuisine: city.cuisine,
          cuisineEn: city.cuisineEn,
          landmarks: city.landmarks,
          landmarksEn: city.landmarksEn,
          stories: city.stories,
          storiesEn: city.storiesEn,
        }}
      />

      <section className="mt-8">
        <h2 className="text-xl font-bold">⭐ {t.topPicks}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((p, i) => (
            <PlaceCard key={p.id} place={p} rank={i + 1} />
          ))}
        </div>
        <FeedFooter
          sentinelRef={sentinelRef}
          loading={loading}
          hasMore={hasMore}
          count={items.length}
        />
      </section>
    </div>
  );
}
