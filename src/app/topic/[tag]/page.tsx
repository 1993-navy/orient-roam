import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TopicView } from "@/components/TopicView";
import { normalizeTag } from "@/lib/hashtags";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const name = normalizeTag(decodeURIComponent(tag));
  return { title: `#${name} — Orient Roam` };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const name = normalizeTag(decodeURIComponent(tag));

  const reviews = await prisma.review.findMany({
    where: { tags: { some: { tag: { name } } } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      place: { select: { id: true, name: true, nameEn: true } },
    },
  });

  return (
    <TopicView
      tag={name}
      reviews={reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        userId: r.user.id,
        userName: r.user.name,
        placeId: r.place.id,
        placeName: r.place.name,
        placeNameEn: r.place.nameEn,
      }))}
    />
  );
}
