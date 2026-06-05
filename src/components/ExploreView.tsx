"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AmapMap } from "@/components/AmapMap";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { Icon } from "@/components/Icon";
import { useLang } from "@/components/LanguageProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { FeedFooter } from "@/components/FeedFooter";
import { pillClass } from "@/lib/ui";
import { categoryLabel, localizedName, CATEGORY_LABELS } from "@/lib/i18n";
import { PLACE_CATEGORIES } from "@/lib/validations";

type ExplorePlace = PlaceCardData & { lng: number; lat: number };

const PRICE_OPTIONS = ["1", "2", "3", "4"];
const RATING_OPTIONS = ["3", "4", "4.5"];

export function ExploreView({
  cities,
  currentCity,
  currentCategory,
  center,
  mapZoom,
  initialPlaces,
  initialHasMore,
}: {
  cities: { id: string; name: string; nameEn: string }[];
  currentCity?: string;
  currentCategory?: string;
  center: { lng: number; lat: number };
  mapZoom: number;
  initialPlaces: ExplorePlace[];
  initialHasMore: boolean;
}) {
  const { locale, t } = useLang();

  // City stays URL-driven (it also recenters the map server-side). Category,
  // search and the price/rating filters are client state → instant, no reload.
  const [category, setCategory] = useState(currentCategory ?? "");
  const [qInput, setQInput] = useState("");
  const [price, setPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const q = useDebounce(qInput.trim(), 300);

  const query = useMemo(() => {
    const usp = new URLSearchParams();
    if (currentCity) usp.set("city", currentCity);
    if (category) usp.set("category", category);
    if (q) usp.set("q", q);
    if (price) usp.set("priceLevel", price);
    if (minRating) usp.set("minRating", minRating);
    return usp.toString();
  }, [currentCity, category, q, price, minRating]);

  const { items, hasMore, loading, sentinelRef } = useInfiniteList<ExplorePlace>({
    endpoint: "/api/places",
    query,
    initial: { items: initialPlaces, hasMore: initialHasMore },
  });

  function cityHref(id: string | null) {
    return id ? `/explore?city=${id}` : "/explore";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t.explore}</h1>

      {/* Sticky search + filters (live, no submit button) */}
      <div className="sticky top-16 z-10 -mx-4 mt-4 bg-white/85 px-4 py-3 backdrop-blur md:top-2 dark:bg-black/80">
        <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 dark:border-white/15 dark:bg-neutral-900">
          <Icon name="search" className="h-4 w-4 text-neutral-400" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t.searchPlaces}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
          {qInput && (
            <button
              type="button"
              onClick={() => setQInput("")}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
        </label>

        {/* Category filter (client state) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterPill active={!category} onClick={() => setCategory("")}>
            {t.allCategories}
          </FilterPill>
          {PLACE_CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]?.emoji} {categoryLabel(cat, locale)}
            </FilterPill>
          ))}
        </div>

        {/* Price + rating filters */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-400">{t.price}:</span>
          <FilterPill active={!price} onClick={() => setPrice("")}>
            {t.any}
          </FilterPill>
          {PRICE_OPTIONS.map((p) => (
            <FilterPill key={p} active={price === p} onClick={() => setPrice(p)}>
              {"¥".repeat(Number(p))}
            </FilterPill>
          ))}
          <span className="ml-2 text-neutral-400">{t.rating}:</span>
          <FilterPill active={!minRating} onClick={() => setMinRating("")}>
            {t.any}
          </FilterPill>
          {RATING_OPTIONS.map((r) => (
            <FilterPill
              key={r}
              active={minRating === r}
              onClick={() => setMinRating(r)}
            >
              ★{r}+
            </FilterPill>
          ))}
        </div>
      </div>

      {/* City filter (URL-driven — recenters map) */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip href={cityHref(null)} active={!currentCity}>
          🌏 {t.allCategories}
        </Chip>
        {cities.map((c) => (
          <Chip key={c.id} href={cityHref(c.id)} active={currentCity === c.id}>
            {localizedName(c, locale)}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-44">
            <AmapMap
              center={center}
              zoom={mapZoom}
              height={480}
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
        </div>

        <div className="space-y-3 lg:order-1">
          <p className="text-sm text-neutral-500">
            {items.length}
            {hasMore ? "+" : ""} {t.topPicks.toLowerCase()} ·{" "}
            <span className="text-neutral-400">ranked by review weight</span>
          </p>

          {items.length === 0 && !loading ? (
            <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
              {t.noResults}
            </p>
          ) : (
            items.map((p, i) => <PlaceCard key={p.id} place={p} rank={i + 1} />)
          )}

          {/* Infinite-scroll sentinel + status */}
          <FeedFooter
            sentinelRef={sentinelRef}
            loading={loading}
            hasMore={hasMore}
            count={items.length}
          />
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={pillClass(active)}
    >
      {children}
    </button>
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
      className={pillClass(active)}
    >
      {children}
    </Link>
  );
}
