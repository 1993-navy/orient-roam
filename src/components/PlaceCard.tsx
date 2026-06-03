"use client";

import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLang } from "@/components/LanguageProvider";
import { categoryLabel, localizedName, priceLevelLabel, CATEGORY_LABELS } from "@/lib/i18n";

export type PlaceCardData = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string | null;
  priceLevel: number;
  avgRating: number;
  reviewCount: number;
  cityName?: string;
  saved?: boolean;
  wished?: boolean;
};

// X-tweet-style information card: tag row → rating → title → one-line blurb
// (expands on hover) → interaction buttons. The whole card is clickable via a
// stretched <Link>; the content layer is pointer-transparent so taps fall
// through to it, while the interaction buttons opt back in to receive clicks.
export function PlaceCard({ place, rank }: { place: PlaceCardData; rank?: number }) {
  const { locale } = useLang();
  const emoji = CATEGORY_LABELS[place.category]?.emoji ?? "📍";

  return (
    <article className="group relative rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
      <Link
        href={`/place/${place.id}`}
        aria-label={localizedName(place, locale)}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      />

      <div className="pointer-events-none relative z-10 flex flex-col gap-2.5">
        {/* Tag row: city · category · price (X-style topic badges) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {rank != null && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
              {rank}
            </span>
          )}
          {place.cityName && <Badge>{place.cityName}</Badge>}
          <Badge>
            <span aria-hidden="true">{emoji}</span> {categoryLabel(place.category, locale)}
          </Badge>
          <Badge className="font-semibold text-emerald-600 dark:text-emerald-400">
            #{priceLevelLabel(place.priceLevel)}
          </Badge>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <RatingStars value={place.avgRating} />
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
            {place.avgRating.toFixed(1)}
          </span>
          <span>({place.reviewCount})</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug group-hover:text-rose-600">
          {localizedName(place, locale)}
        </h3>

        {/* One-line blurb — expands on hover/focus-within */}
        {(place.description ?? categoryLabel(place.category, locale)) && (
          <p className="line-clamp-1 text-sm text-neutral-500 transition-all group-hover:line-clamp-none group-focus-within:line-clamp-none dark:text-neutral-400">
            {place.description ?? categoryLabel(place.category, locale)}
          </p>
        )}

        {/* Interaction buttons */}
        <div className="pointer-events-auto mt-1 flex items-center gap-2">
          <FavoriteButton placeId={place.id} kind="wish" initialActive={place.wished} />
          <FavoriteButton placeId={place.id} kind="save" initialActive={place.saved} />
        </div>
      </div>
    </article>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 ${className}`}
    >
      {children}
    </span>
  );
}
