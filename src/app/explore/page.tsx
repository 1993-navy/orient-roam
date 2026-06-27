import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ExploreView } from "@/components/ExploreView";
import { PLACE_CATEGORIES } from "@/lib/validations";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData, getPlaceForeignerTagMap } from "@/lib/places";
import { getHybridRecommendations } from "@/lib/recommendation";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  const sp = await searchParams;
  const cityId = sp.city;
  const category =
    sp.category && PLACE_CATEGORIES.includes(sp.category as never)
      ? sp.category
      : undefined;

  const PAGE = 18;
  const [cities, rows] = await Promise.all([
    prisma.city.findMany({ orderBy: { nameEn: "asc" } }),
    getHybridRecommendations({
      userId,
      cityId,
      category,
      limit: PAGE + 1,
    }),
  ]);

  const initialHasMore = rows.length > PAGE;
  const places = initialHasMore ? rows.slice(0, PAGE) : rows;

  const [{ saved, wished }, tagMap] = await Promise.all([
    getUserFavoriteSets(places.map((p) => p.id)),
    getPlaceForeignerTagMap(places.map((p) => p.id)),
  ]);

  const selectedCity = cityId ? cities.find((c) => c.id === cityId) : undefined;
  const center = selectedCity
    ? { lng: selectedCity.lng, lat: selectedCity.lat }
    : places[0]
      ? { lng: places[0].lng, lat: places[0].lat }
      : { lng: 116.4074, lat: 39.9042 };

  return (
    <ExploreView
      cities={cities.map((c) => ({ id: c.id, name: c.name, nameEn: c.nameEn }))}
      currentCity={cityId}
      currentCategory={category}
      center={center}
      mapZoom={selectedCity ? 11 : 5}
      initialHasMore={initialHasMore}
      initialPlaces={places.map((p) =>
        toPlaceCardData(p, { saved, wished }, tagMap.get(p.id)),
      )}
    />
  );
}
