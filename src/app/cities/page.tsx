import { prisma } from "@/lib/prisma";
import { CityCard } from "@/components/CityCard";
import { T } from "@/components/T";

export default async function CitiesPage() {
  const cities = await prisma.city.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { places: true } } },
  });

  const livableCities = cities.filter((c) => c.isLivable);

  const toCardData = (c: (typeof cities)[number]) => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    province: c.province,
    summary: c.summary,
    placeCount: c._count.places,
    isLivable: c.isLivable,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold">
        <T k="cities" />
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Explore {cities.length} cities across China — from buzzing metropolises to charming smaller destinations.
      </p>

      {livableCities.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-lg font-semibold">Top Livable Cities</h2>
            <span className="text-sm text-neutral-400">({livableCities.length})</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Livable
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {livableCities.map((c) => (
              <CityCard key={c.id} city={toCardData(c)} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">All Cities</h2>
          <span className="text-sm text-neutral-400">({cities.length})</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <CityCard key={c.id} city={toCardData(c)} />
          ))}
        </div>
      </div>
    </div>
  );
}
