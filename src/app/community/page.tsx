import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunityView } from "@/components/CommunityView";

export default async function CommunityPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [communities, meetups, cities] = await Promise.all([
    prisma.community.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameEn: true } },
        _count: { select: { members: true } },
        members: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    }),
    prisma.meetup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameEn: true } },
        place: { select: { nameEn: true } },
        host: { select: { name: true } },
        _count: { select: { participants: true } },
        participants: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    }),
    prisma.city.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
  ]);

  return (
    <CommunityView
      isAuthed={Boolean(userId)}
      cities={cities}
      communities={communities.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        cityName: c.city?.nameEn ?? null,
        memberCount: c._count.members,
        joined: Array.isArray(c.members) ? c.members.length > 0 : false,
      }))}
      meetups={meetups.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        cityName: m.city?.nameEn ?? null,
        placeName: m.place?.nameEn ?? null,
        hostName: m.host.name,
        participantCount: m._count.participants,
        maxPeople: m.maxPeople,
        joined: Array.isArray(m.participants) ? m.participants.length > 0 : false,
      }))}
    />
  );
}
