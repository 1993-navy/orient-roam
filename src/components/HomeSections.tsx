"use client";

import { useLang } from "@/components/LanguageProvider";
import { CityCard, type CityCardData } from "@/components/CityCard";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";

export function HomeSections({
  cities,
  topPlaces,
}: {
  cities: CityCardData[];
  topPlaces: PlaceCardData[];
}) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section>
        <h2 className="text-2xl font-bold">{t.chooseCity}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <CityCard key={c.id} city={c} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">⭐ {t.topPicks}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {topPlaces.map((p, i) => (
            <PlaceCard key={p.id} place={p} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
