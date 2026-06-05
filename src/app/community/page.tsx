import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunityView } from "@/components/CommunityView";
import { getUserPostLikes } from "@/lib/posts";

const FEED_PAGE = 15;

export default async function CommunityPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [communities, meetups, cities, postRows] = await Promise.all([
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
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        city: { select: { nameEn: true } },
      },
      take: FEED_PAGE + 1,
    }),
  ]);

  const initialHasMore = postRows.length > FEED_PAGE;
  const feedPage = initialHasMore ? postRows.slice(0, FEED_PAGE) : postRows;
  const likedSet = await getUserPostLikes(feedPage.map((p) => p.id));

  return (
    <CommunityView
      isAuthed={Boolean(userId)}
      meId={userId}
      cities={cities}
      initialHasMore={initialHasMore}
      initialPosts={feedPage.map((p) => ({
        id: p.id,
        body: p.body,
        createdAt: p.createdAt.toISOString(),
        authorId: p.author.id,
        authorName: p.author.name,
        cityName: p.city?.nameEn ?? null,
        likeCount: p.likeCount,
        liked: likedSet.has(p.id),
      }))}
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
        hostId: m.hostId,
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
