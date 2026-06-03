"use client";

import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
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
};

export function PlaceCard({ place, rank }: { place: PlaceCardData; rank?: number }) {
  const { locale } = useLang();
  const emoji = CATEGORY_LABELS[place.category]?.emoji ?? "📍";

  return (
    <Link
      href={`/place/${place.id}`}
      className="group flex gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
    >
      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 text-2xl dark:from-neutral-800 dark:to-neutral-800">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {rank != null && (
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
              {rank}
            </span>
          )}
          <h3 className="truncate font-semibold group-hover:text-rose-600">
            {localizedName(place, locale)}
          </h3>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
          {place.description ?? `${categoryLabel(place.category, locale)}`}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <RatingStars value={place.avgRating} />
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {place.avgRating.toFixed(1)}
            </span>
            <span>({place.reviewCount})</span>
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            {categoryLabel(place.category, locale)}
          </span>
          <span className="text-emerald-600">{priceLevelLabel(place.priceLevel)}</span>
          {place.cityName && <span>· {place.cityName}</span>}
        </div>
      </div>
    </Link>
  );
}
