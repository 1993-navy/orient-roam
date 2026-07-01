import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData } from "@/lib/places";
import { getHybridRecommendations, getTrendingPlaces } from "@/lib/recommendation";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  const [cities, topPlaces, trendingPlaces] = await Promise.all([
    prisma.city.findMany({
      orderBy: { nameEn: "asc" },
      include: { _count: { select: { places: true } } },
    }),
    getHybridRecommendations({ userId, limit: 6 }),
    getTrendingPlaces({ limit: 6 }),
  ]);

  const allPlaceIds = [...topPlaces.map((p) => p.id), ...trendingPlaces.map((p) => p.id)];
  const { saved, wished } = await getUserFavoriteSets(allPlaceIds);

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
          isLivable: c.isLivable,
        }))}
        topPlaces={topPlaces.map((p) => toPlaceCardData(p, { saved, wished }))}
        trendingPlaces={trendingPlaces.map((p) => toPlaceCardData(p, { saved, wished }))}
      />
    </>
  );
}
