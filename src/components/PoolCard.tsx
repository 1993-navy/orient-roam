"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { biLabel, FOREIGNER_TAG_LABELS } from "@/lib/i18n";

import { Avatar } from "@/components/Avatar";

export type PoolCardData = {
  id: string;
  title: string;
  description: string | null;
  cityName: string | null;
  placeId: string | null;
  placeName: string | null;
  placeForeignerTags?: string[];
  organizerName: string;
  unitPriceCents: number | null;
  targetPeople: number;
  currentPeople: number;
  deadline: string | null;
  status: string;
};

export function priceYuan(cents: number | null): string | null {
  if (cents == null) return null;
  const y = cents / 100;
  return "¥" + (Number.isInteger(y) ? y.toString() : y.toFixed(1));
}

export function PoolCard({ pool }: { pool: PoolCardData }) {
  const { t, locale } = useLang();
  const formed = pool.status === "formed" || pool.currentPeople >= pool.targetPeople;
  const pct = Math.min(100, Math.round((pool.currentPeople / pool.targetPeople) * 100));
  const price = priceYuan(pool.unitPriceCents);

  return (
    <article className="card p-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <Avatar name={pool.organizerName} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
              🧧 {locale === "zh" ? "拼团" : "Pool"}
            </span>
            {pool.cityName && <span className="text-neutral-500">{pool.cityName}</span>}
            {formed && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ {t.formed}
              </span>
            )}
          </div>

          <h3 className="mt-1 text-lg font-semibold">
            <Link href={`/pool/${pool.id}`} className="hover:text-rose-600">
              {pool.title}
            </Link>
          </h3>

          {pool.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
              {pool.description}
            </p>
          )}

          {/* Progress toward the threshold */}
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full ${formed ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                👥 {pool.currentPeople}/{pool.targetPeople}
              </span>
              {!formed && (
                <span>{pool.targetPeople - pool.currentPeople} {t.needMore}</span>
              )}
              {price && <span className="text-emerald-600">{price} {t.perPerson}</span>}
              {pool.placeName && (
                <span>
                  📍{" "}
                  {pool.placeId ? (
                    <Link href={`/place/${pool.placeId}`} className="hover:text-rose-600">
                      {pool.placeName}
                    </Link>
                  ) : (
                    pool.placeName
                  )}
                </span>
              )}
            </div>
          </div>

          {pool.placeForeignerTags && pool.placeForeignerTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pool.placeForeignerTags.slice(0, 4).map((tag) => {
                const label = FOREIGNER_TAG_LABELS[tag];
                if (!label) return null;
                return (
                  <span
                    key={tag}
                    title={biLabel(label, locale)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <span aria-hidden="true">{label.emoji}</span>
                    <span>{biLabel(label, locale)}</span>

                  </span>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href={`/pool/${pool.id}`}
          className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {formed ? "View" : t.joinPool}
        </Link>
      </div>
    </article>
  );
}
