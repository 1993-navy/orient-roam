import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PoolDetailView } from "@/components/PoolDetailView";
import { getPlaceForeignerTagMap } from "@/lib/places";

export default async function PoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const me = session?.user?.id ?? null;

  const pool = await prisma.groupPool.findUnique({
    where: { id },
    include: {
      city: { select: { nameEn: true } },
      place: { select: { id: true, nameEn: true } },
      organizer: { select: { id: true, name: true } },
      members: {
        where: { status: "joined" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!pool || pool.status === "removed") notFound();

  const members = pool.members.map((m) => ({ id: m.user.id, name: m.user.name }));
  const placeForeignerTags = pool.place
    ? (await getPlaceForeignerTagMap([pool.place.id])).get(pool.place.id) ?? []
    : [];

  return (
    <PoolDetailView
      meId={me}
      isOrganizer={me === pool.organizerId}
      isJoined={me ? members.some((u) => u.id === me) : false}
      members={members}
      pool={{
        id: pool.id,
        title: pool.title,
        description: pool.description,
        cityName: pool.city?.nameEn ?? null,
        placeId: pool.place?.id ?? null,
        placeName: pool.place?.nameEn ?? null,
        placeForeignerTags,
        productUrl: pool.productUrl,
        organizerId: pool.organizer.id,
        organizerName: pool.organizer.name,
        unitPriceCents: pool.unitPriceCents,
        targetPeople: pool.targetPeople,
        maxPeople: pool.maxPeople,
        deadline: pool.deadline?.toISOString() ?? null,
        status: pool.status,
      }}
    />
  );
}
