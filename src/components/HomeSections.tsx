"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { CityCard, type CityCardData } from "@/components/CityCard";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { MeetupCard } from "@/components/MeetupCard";
import { PoolCard, type PoolCardData } from "@/components/PoolCard";

// Meetup card shape (mirrors MeetupCard's prop) — kept loose to avoid a hard
// import-type dependency on the page mapping.
type HomeMeetup = Parameters<typeof MeetupCard>[0]["meetup"];

const HUB = [
  { href: "/explore", emoji: "🍜", key: "eats" },
  { href: "/meetups", emoji: "🍽️", key: "meetups" },
  { href: "/pools", emoji: "🧧", key: "pools" },
  { href: "/community", emoji: "💬", key: "community" },
] as const;

export function HomeSections({
  cities,
  topPlaces,
  trendingPlaces,
  meetups = [],
  pools = [],
}: {
  cities: CityCardData[];
  topPlaces: PlaceCardData[];
  trendingPlaces?: PlaceCardData[];
  meetups?: HomeMeetup[];
  pools?: PoolCardData[];
}) {
  const { t } = useLang();

  const hubLabel: Record<string, string> = {
    eats: t.explore,
    meetups: t.findMeetups,
    pools: t.groupPools,
    community: t.community,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Discovery hub — one tap to each pillar of the community */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HUB.map((h) => (
            <Link
              key={h.key}
              href={h.href}
              className="card flex flex-col items-center gap-2 p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-3xl">{h.emoji}</span>
              <span className="text-sm font-semibold">{hubLabel[h.key]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Meal meetups */}
      {meetups.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">🍽️ {t.findMeetups}</h2>
            <Link href="/meetups" className="text-sm font-semibold text-rose-600 hover:underline">
              {t.viewDetails} →
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {meetups.map((m) => (
              <MeetupCard key={m.id} meetup={m} />
            ))}
          </div>
        </section>
      )}

      {/* Group pools */}
      {pools.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">🧧 {t.groupPools}</h2>
            <Link href="/pools" className="text-sm font-semibold text-rose-600 hover:underline">
              {t.viewDetails} →
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {pools.map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{t.chooseCity}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <CityCard key={c.id} city={c} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">⭐ {t.topPicks}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {topPlaces.map((p, i) => (
            <PlaceCard key={p.id} place={p} rank={i + 1} />
          ))}
        </div>
      </section>

      {trendingPlaces && trendingPlaces.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">🔥</span>
            <h2 className="text-2xl font-bold">Trending Places</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {trendingPlaces.map((p, i) => (
              <PlaceCard key={p.id} place={p} rank={i + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
