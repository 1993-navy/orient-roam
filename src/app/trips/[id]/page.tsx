import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TripDetailView } from "@/components/TripDetailView";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      city: { select: { nameEn: true } },
      stops: {
        orderBy: [{ day: "asc" }, { createdAt: "asc" }],
        include: { place: { select: { id: true, name: true, nameEn: true, category: true } } },
      },
    },
  });
  if (!trip) notFound();

  return (
    <TripDetailView
      isOwner={session?.user?.id === trip.ownerId}
      trip={{ id: trip.id, title: trip.title, cityName: trip.city?.nameEn ?? null }}
      stops={trip.stops.map((s) => ({
        id: s.id,
        day: s.day,
        placeId: s.place.id,
        placeName: s.place.nameEn,
        placeNameZh: s.place.name,
        category: s.place.category,
      }))}
    />
  );
}
