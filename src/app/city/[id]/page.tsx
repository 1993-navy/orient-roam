import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CityView } from "@/components/CityView";
import { getUserFavoriteSets } from "@/lib/favorites";

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // First page only — CityView appends more via /api/places?city=… on scroll.
  const PAGE = 18;
  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      places: {
        orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
        include: { city: { select: { nameEn: true } } },
        take: PAGE + 1,
      },
    },
  });

  if (!city) notFound();

  const initialHasMore = city.places.length > PAGE;
  const placeRows = initialHasMore ? city.places.slice(0, PAGE) : city.places;

  const { saved, wished } = await getUserFavoriteSets(placeRows.map((p) => p.id));

  return (
    <CityView
      city={{
        id: city.id,
        name: city.name,
        nameEn: city.nameEn,
        province: city.province,
        summary: city.summary,
        lng: city.lng,
        lat: city.lat,
      }}
      initialHasMore={initialHasMore}
      initialPlaces={placeRows.map((p) => ({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category,
        description: p.description,
        priceLevel: p.priceLevel,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
        cityName: p.city.nameEn,
        saved: saved.has(p.id),
        wished: wished.has(p.id),
        lng: p.lng,
        lat: p.lat,
      }))}
    />
  );
}
