import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData, getPlaceForeignerTagMap } from "@/lib/places";
import { getHybridRecommendations, getTrendingPlaces } from "@/lib/recommendation";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;
  const now = new Date();

  const [cities, topPlaces, trendingPlaces, meetupRows, poolRows] = await Promise.all([
    prisma.city.findMany({
      orderBy: { nameEn: "asc" },
      include: { _count: { select: { places: true } } },
    }),
    getHybridRecommendations({ userId, limit: 6 }),
    getTrendingPlaces({ limit: 6 }),
    prisma.meetup.findMany({
      where: { type: "MEAL", status: { in: ["open", "full"] }, startTime: { gte: now } },
      orderBy: { startTime: "asc" },
      take: 3,
      include: {
        city: { select: { nameEn: true, name: true } },
        place: { select: { id: true, nameEn: true } },
        host: { select: { id: true, name: true } },
        participants: { where: { status: "joined" } },
      },
    }),
    prisma.groupPool.findMany({
      where: {
        status: { in: ["open", "formed"] },
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        city: { select: { nameEn: true } },
        place: { select: { id: true, nameEn: true } },
        organizer: { select: { name: true } },
        members: { where: { status: "joined" } },
      },
    }),
  ]);

  const allPlaceIds = [...topPlaces.map((p) => p.id), ...trendingPlaces.map((p) => p.id)];
  const { saved, wished } = await getUserFavoriteSets(allPlaceIds);

  // Foreigner-friendly tags for restaurants linked to meetups/pools.
  const linkedPlaceIds = [
    ...meetupRows.map((m) => m.place?.id),
    ...poolRows.map((p) => p.place?.id),
  ].filter((id): id is string => Boolean(id));
  const tagMap = await getPlaceForeignerTagMap(linkedPlaceIds);

  const meetups = meetupRows.map((m) => ({
    id: m.id,
    type: m.type,
    title: m.title,
    description: m.description,
    cityName: m.city?.nameEn ?? null,
    cityNameZh: m.city?.name ?? null,
    placeId: m.place?.id ?? null,
    placeName: m.place?.nameEn ?? null,
    placeForeignerTags: m.place?.id ? tagMap.get(m.place.id) ?? [] : [],
    hostId: m.host.id,
    hostName: m.host.name,
    startTime: m.startTime?.toISOString() ?? null,
    endTime: m.endTime?.toISOString() ?? null,
    maxPeople: m.maxPeople,
    currentPeople: m.participants.length,
    recurrence: m.recurrence,
    recurrenceDay: m.recurrenceDay,
    status: m.status,
  }));

  const pools = poolRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    cityName: p.city?.nameEn ?? null,
    placeId: p.place?.id ?? null,
    placeName: p.place?.nameEn ?? null,
    placeForeignerTags: p.place?.id ? tagMap.get(p.place.id) ?? [] : [],
    organizerName: p.organizer.name,
    unitPriceCents: p.unitPriceCents,
    targetPeople: p.targetPeople,
    currentPeople: p.members.length,
    deadline: p.deadline?.toISOString() ?? null,
    status: p.status,
  }));

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
        meetups={meetups}
        pools={pools}
      />
    </>
  );
}
