import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunityDetailView } from "@/components/CommunityDetailView";
import { notFound } from "next/navigation";

export default async function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const community = await prisma.community.findUnique({
    where: { id: params.id },
    include: {
      city: { select: { id: true, name: true, nameEn: true } },
      owner: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!community) {
    notFound();
  }

  const isJoined = userId ? community.members.some((m) => m.userId === userId) : false;
  const isOwner = userId ? community.ownerId === userId : false;

  const [posts, meetups] = await Promise.all([
    prisma.post.findMany({
      where: { cityId: community.cityId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.meetup.findMany({
      where: { cityId: community.cityId, status: "open" },
      orderBy: { createdAt: "desc" },
      include: { host: { select: { name: true } } },
      take: 5,
    }),
  ]);

  let conversation = null;
  if (userId) {
    conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: true,
        title: community.name,
        members: { some: { userId } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
  }

  return (
    <CommunityDetailView
      community={{
        id: community.id,
        name: community.name,
        description: community.description,
        cityId: community.cityId ?? null,
        cityName: community.city?.nameEn ?? community.city?.name ?? null,
        ownerId: community.owner.id,
        ownerName: community.owner.name,
        members: community.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          joinedAt: m.joinedAt.toISOString(),
        })),
      }}
      isAuthed={Boolean(userId)}
      isJoined={isJoined}
      isOwner={isOwner}
      posts={posts.map((p) => ({
        id: p.id,
        body: p.body,
        createdAt: p.createdAt.toISOString(),
        authorId: p.author.id,
        authorName: p.author.name,
      }))}
      meetups={meetups.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        hostName: m.host.name,
        participantCount: 0,
        maxPeople: m.maxPeople,
      }))}
      conversation={conversation
        ? {
            id: conversation.id,
            title: conversation.title,
            messages: conversation.messages.map((msg) => ({
              id: msg.id,
              body: msg.body,
              senderId: msg.senderId,
              senderName: conversation.members.find((m) => m.userId === msg.senderId)?.user.name ?? "Unknown",
              createdAt: msg.createdAt.toISOString(),
            })),
            members: conversation.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              role: m.role,
            })),
          }
        : null}
    />
  );
}