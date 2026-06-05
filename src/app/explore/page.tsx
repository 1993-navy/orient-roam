import { prisma } from "@/lib/prisma";
import { ExploreView } from "@/components/ExploreView";
import { PLACE_CATEGORIES } from "@/lib/validations";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData } from "@/lib/places";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const cityId = sp.city;
  const category =
    sp.category && PLACE_CATEGORIES.includes(sp.category as never)
      ? sp.category
      : undefined;

  // First page only — the client appends more via /api/places as you scroll.
  const PAGE = 18;
  const [cities, rows] = await Promise.all([
    prisma.city.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.place.findMany({
      where: {
        ...(cityId ? { cityId } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
      include: { city: { select: { name: true, nameEn: true } } },
      take: PAGE + 1,
    }),
  ]);

  const initialHasMore = rows.length > PAGE;
  const places = initialHasMore ? rows.slice(0, PAGE) : rows;

  const { saved, wished } = await getUserFavoriteSets(places.map((p) => p.id));

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
      initialPlaces={places.map((p) => toPlaceCardData(p, { saved, wished }))}
    />
  );
}
