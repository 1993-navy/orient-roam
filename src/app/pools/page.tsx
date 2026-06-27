import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PoolCard } from "@/components/PoolCard";
import { PoolForm } from "@/components/PoolForm";
import { MeetupFilters } from "@/components/MeetupFilters";
import { getPlaceForeignerTagMap } from "@/lib/places";

export default async function PoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; filter?: string }>;
}) {
  const session = await auth();
  const me = session?.user?.id ?? null;
  const sp = await searchParams;
  const cityId = sp.city || undefined;
  const mine = sp.filter === "mine" && Boolean(me);

  const where: Prisma.GroupPoolWhereInput =
    mine && me
      ? {
          NOT: { status: "removed" },
          OR: [
            { organizerId: me },
            { members: { some: { userId: me, status: "joined" } } },
          ],
          ...(cityId ? { cityId } : {}),
        }
      : {
          status: { in: ["open", "formed"] },
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          ...(cityId ? { cityId } : {}),
        };

  const [cities, rows] = await Promise.all([
    prisma.city.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true, name: true } }),
    prisma.groupPool.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameEn: true } },
        place: { select: { id: true, nameEn: true } },
        organizer: { select: { name: true } },
        members: { where: { status: "joined" } },
      },
      take: 40,
    }),
  ]);

  const placeIds = rows.map((p) => p.place?.id).filter((id): id is string => Boolean(id));
  const tagMap = await getPlaceForeignerTagMap(placeIds);

  const pools = rows.map((p) => ({
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧧 Group Pools</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Team up to hit a group-buy threshold — split bulk buys & deals
          </p>
        </div>
        <PoolForm cities={cities} />
      </div>

      <MeetupFilters
        cities={cities.map((c) => ({ id: c.id, nameEn: c.nameEn }))}
        currentCity={cityId}
        mine={mine}
        basePath="/pools"
        hideTypes
      />

      {pools.length === 0 ? (
        <p className="mt-8 text-center text-neutral-500">No open pools — start the first one!</p>
      ) : (
        <div className="mt-6 space-y-4">
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
