import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";

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
        topPlaces={topPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          category: p.category,
          description: p.description,
          priceLevel: p.priceLevel,
          avgRating: p.avgRating,
          reviewCount: p.reviewCount,
          cityName: p.city.nameEn,
        }))}
      />
    </>
  );
}
