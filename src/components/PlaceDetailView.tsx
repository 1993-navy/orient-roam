"use client";

import Link from "next/link";
import { AmapMap } from "@/components/AmapMap";
import { RatingStars } from "@/components/RatingStars";
import { ReviewForm } from "@/components/ReviewForm";
import { HashtagText } from "@/lib/hashtags";
import { useLang } from "@/components/LanguageProvider";
import {
  categoryLabel,
  localizedName,
  priceLevelLabel,
  CATEGORY_LABELS,
} from "@/lib/i18n";

type PlaceDetail = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string | null;
  address: string | null;
  priceLevel: number;
  avgRating: number;
  reviewCount: number;
  lng: number;
  lat: number;
  cityName: string;
  cityId: string;
};

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  userName: string;
  createdAt: string;
};

export function PlaceDetailView({
  place,
  reviews,
  myReview,
}: {
  place: PlaceDetail;
  reviews: ReviewItem[];
  myReview: { rating: number; comment: string | null } | null;
}) {
  const { locale, t } = useLang();
  const emoji = CATEGORY_LABELS[place.category]?.emoji ?? "📍";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/explore" className="text-sm text-neutral-500 hover:text-rose-600">
        ← {t.backToExplore}
      </Link>

      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 text-3xl dark:from-neutral-800 dark:to-neutral-800">
          {emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{localizedName(place, locale)}</h1>
          <p className="text-sm text-neutral-500">
            {locale === "zh" ? place.nameEn : place.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <RatingStars value={place.avgRating} />
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                {place.avgRating.toFixed(1)}
              </span>
              <span>
                · {place.reviewCount} {t.reviews}
              </span>
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              {categoryLabel(place.category, locale)}
            </span>
            <span className="text-emerald-600">{priceLevelLabel(place.priceLevel)}</span>
            <Link href={`/city/${place.cityId}`} className="hover:text-rose-600">
              📍 {place.cityName}
            </Link>
          </div>
        </div>
      </div>

      {place.description && (
        <p className="mt-4 text-neutral-700 dark:text-neutral-300">{place.description}</p>
      )}
      {place.address && (
        <p className="mt-1 text-sm text-neutral-500">{place.address}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <AmapMap
            center={{ lng: place.lng, lat: place.lat }}
            zoom={14}
            height={300}
            markers={[
              {
                id: place.id,
                name: localizedName(place, locale),
                lng: place.lng,
                lat: place.lat,
                category: place.category,
                rating: place.avgRating,
              },
            ]}
          />
        </div>

        <div>
          <ReviewForm placeId={place.id} existing={myReview} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          {place.reviewCount} {t.reviews}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t.noReviews}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.userName}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <RatingStars value={r.rating} className="mt-1 text-sm" />
                {r.comment && (
                  <HashtagText
                    text={r.comment}
                    className="mt-1 text-sm text-neutral-600 dark:text-neutral-300"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
