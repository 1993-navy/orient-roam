import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MeetupDetailView } from "@/components/MeetupDetailView";
import { getPlaceForeignerTagMap } from "@/lib/places";

export default async function MeetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const me = session?.user?.id ?? null;

  const meetup = await prisma.meetup.findUnique({
    where: { id },
    include: {
      city: { select: { nameEn: true } },
      place: { select: { id: true, nameEn: true } },
      host: { select: { id: true, name: true } },
      participants: {
        where: { status: "joined" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!meetup) notFound();

  const members = meetup.participants.map((p) => ({
    id: p.user.id,
    name: p.user.name,
  }));

  const placeForeignerTags = meetup.place
    ? (await getPlaceForeignerTagMap([meetup.place.id])).get(meetup.place.id) ?? []
    : [];

  return (
    <MeetupDetailView
      meId={me}
      isJoined={me ? members.some((u) => u.id === me) : false}
      isHost={me === meetup.host.id}
      members={members}
      meetup={{
        id: meetup.id,
        type: meetup.type,
        title: meetup.title,
        description: meetup.description,
        cityName: meetup.city?.nameEn ?? null,
        placeId: meetup.place?.id ?? null,
        placeName: meetup.place?.nameEn ?? null,
        placeForeignerTags,
        hostId: meetup.host.id,
        hostName: meetup.host.name,
        startTime: meetup.startTime?.toISOString() ?? null,
        endTime: meetup.endTime?.toISOString() ?? null,
        maxPeople: meetup.maxPeople,
        recurrence: meetup.recurrence,
        recurrenceDay: meetup.recurrenceDay,
      }}
    />
  );
}
