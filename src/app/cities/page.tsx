import { prisma } from "@/lib/prisma";
import { CityCard } from "@/components/CityCard";
import { T } from "@/components/T";

export default async function CitiesPage() {
  const cities = await prisma.city.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { places: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        <T k="cities" />
      </h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <CityCard
            key={c.id}
            city={{
              id: c.id,
              name: c.name,
              nameEn: c.nameEn,
              province: c.province,
              summary: c.summary,
              placeCount: c._count.places,
            }}
          />
        ))}
      </div>
    </div>
  );
}
