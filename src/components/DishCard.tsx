"use client";

import { useState } from "react";
import { RatingStars } from "@/components/RatingStars";
import { DishReviewForm } from "@/components/DishReviewForm";
import { useLang } from "@/components/LanguageProvider";
import { localizedName } from "@/lib/i18n";

export type DishItem = {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  priceCents: number | null;
  avgRating: number;
  reviewCount: number;
  mustTryCount: number;
  myReview: { rating: number; comment: string | null; mustTry: boolean } | null;
};

function priceLabel(cents: number | null): string | null {
  if (cents == null) return null;
  const yuan = cents / 100;
  return "¥" + (Number.isInteger(yuan) ? yuan.toString() : yuan.toFixed(1));
}

export function DishCard({ dish }: { dish: DishItem }) {
  const { t, locale } = useLang();
  const [open, setOpen] = useState(false);
  const price = priceLabel(dish.priceCents);

  return (
    <li className="rounded-xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{localizedName(dish, locale)}</span>
            {dish.mustTryCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                ⭐ {dish.mustTryCount} {t.mustTryShort}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {locale === "zh" ? dish.nameEn : dish.name}
          </p>
          {dish.description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {dish.description}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            {dish.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <RatingStars value={dish.avgRating} className="text-sm" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                  {dish.avgRating.toFixed(1)}
                </span>
                <span>· {dish.reviewCount}</span>
              </span>
            ) : (
              <span className="text-xs text-neutral-400">{t.noReviews}</span>
            )}
          </div>
        </div>
        {price && (
          <span className="flex-none font-semibold text-emerald-600">{price}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-xs font-medium text-rose-600 hover:underline"
      >
        {dish.myReview ? `★ ${dish.myReview.rating}/5 · ${t.rateDish}` : t.rateDish} {open ? "▲" : "▼"}
      </button>

      {open && (
        <DishReviewForm
          dishId={dish.id}
          existing={dish.myReview}
          onSaved={() => setOpen(false)}
        />
      )}
    </li>
  );
}
