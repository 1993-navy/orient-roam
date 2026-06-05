import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData } from "@/lib/places";

export default async function HomePage() {
  const [cities, topPlaces] = await Promise.all([
    prisma.city.findMany({
      orderBy: { nameEn: "asc" },
      include: { _count: { select: { places: true } } },
    }),
    prisma.place.findMany({
      orderBy: { weightScore: "desc" },
      take: 6,
      include: { city: true },
    }),
  ]);

  const { saved, wished } = await getUserFavoriteSets(topPlaces.map((p) => p.id));

  return (
    <>
      <Hero />
      <HomeSections
        cities={cities.map((c) => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          province: c.province,
          summary: c.summary,
          placeCount: c._count.places,
        }))}
        topPlaces={topPlaces.map((p) => toPlaceCardData(p, { saved, wished }))}
      />
    </>
  );
}
