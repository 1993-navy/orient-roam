import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CityView } from "@/components/CityView";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData } from "@/lib/places";
import { getHybridRecommendations } from "@/lib/recommendation";

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  const { id } = await params;
  const PAGE = 18;

  const [city, media, placeRows] = await Promise.all([
    prisma.city.findUnique({
      where: { id },
    }),
    prisma.cityMedia.findMany({
      where: { cityId: id },
      orderBy: { position: "asc" },
    }),
    getHybridRecommendations({
      userId,
      cityId: id,
      limit: PAGE + 1,
    }),
  ]);

  if (!city) notFound();

  const initialHasMore = placeRows.length > PAGE;
  const places = initialHasMore ? placeRows.slice(0, PAGE) : placeRows;

  const { saved, wished } = await getUserFavoriteSets(places.map((p) => p.id));

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
        coverImage: city.coverImage,
        history: city.history,
        historyEn: city.historyEn,
        culture: city.culture,
        cultureEn: city.cultureEn,
        cuisine: city.cuisine,
        cuisineEn: city.cuisineEn,
        landmarks: city.landmarks,
        landmarksEn: city.landmarksEn,
        stories: city.stories,
        storiesEn: city.storiesEn,
      }}
      media={media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        caption: m.caption,
        captionEn: m.captionEn,
      }))}
      initialHasMore={initialHasMore}
      initialPlaces={places.map((p) => toPlaceCardData(p, { saved, wished }))}
    />
  );
}
