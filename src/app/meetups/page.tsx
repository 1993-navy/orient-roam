import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MeetupCard } from "@/components/MeetupCard";
import { MeetupForm } from "@/components/MeetupForm";
import { MeetupFilters } from "@/components/MeetupFilters";
import { getPlaceForeignerTagMap } from "@/lib/places";

const MEETUP_TYPES = ["MEAL", "SHOPPING", "TRIP", "ACTIVITY"];

export default async function MeetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; filter?: string }>;
}) {
  const session = await auth();
  const me = session?.user?.id ?? null;

  const sp = await searchParams;
  const type = sp.type && MEETUP_TYPES.includes(sp.type) ? sp.type : undefined;
  const cityId = sp.city || undefined;
  const mine = sp.filter === "mine" && Boolean(me);

  // "My meetups" = hosting or joined (incl. past). Otherwise upcoming & joinable.
  const where: Prisma.MeetupWhereInput =
    mine && me
      ? {
          NOT: { status: "removed" },
          OR: [
            { hostId: me },
            { participants: { some: { userId: me, status: "joined" } } },
          ],
          ...(type ? { type } : {}),
          ...(cityId ? { cityId } : {}),
        }
      : {
          status: { in: ["open", "full"] },
          startTime: { gte: new Date() },
          ...(type ? { type } : {}),
          ...(cityId ? { cityId } : {}),
        };

  const orderBy: Prisma.MeetupOrderByWithRelationInput[] = mine
    ? [{ startTime: "desc" }, { createdAt: "desc" }]
    : [{ startTime: "asc" }, { createdAt: "desc" }];

  const [cities, rows] = await Promise.all([
    prisma.city.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, name: true },
    }),
    prisma.meetup.findMany({
      where,
      orderBy,
      include: {
        city: { select: { nameEn: true, name: true } },
        place: { select: { id: true, nameEn: true } },
        host: { select: { id: true, name: true } },
        participants: { where: { status: "joined" } },
      },
      take: 30,
    }),
  ]);

  // Batch-fetch foreigner-friendly tags for every linked restaurant.
  const placeIds = rows.map((m) => m.place?.id).filter((id): id is string => Boolean(id));
  const tagMap = await getPlaceForeignerTagMap(placeIds);

  const meetups = rows.map((m) => ({
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Find Meetups</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Join group meals, travel buddies, and regular activities
          </p>
        </div>
        <MeetupForm cities={cities} />
      </div>

      <MeetupFilters
        cities={cities.map((c) => ({ id: c.id, nameEn: c.nameEn }))}
        currentType={type}
        currentCity={cityId}
        mine={mine}
      />

      {meetups.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-neutral-500">
            {mine
              ? "You haven't hosted or joined any meetups yet."
              : "No meetups match — try a different filter, or create one!"}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {meetups.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} />
          ))}
        </div>
      )}
    </div>
  );
}
