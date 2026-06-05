import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TopicView } from "@/components/TopicView";
import { normalizeTag } from "@/lib/hashtags";
import { getUserPostLikes } from "@/lib/posts";

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

  const [reviews, postRows] = await Promise.all([
    prisma.review.findMany({
      where: { tags: { some: { tag: { name } } } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        place: { select: { id: true, name: true, nameEn: true } },
      },
    }),
    prisma.post.findMany({
      where: { tags: { some: { tag: { name } } } },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        city: { select: { nameEn: true } },
      },
    }),
  ]);

  const likedSet = await getUserPostLikes(postRows.map((p) => p.id));

  return (
    <TopicView
      tag={name}
      posts={postRows.map((p) => ({
        id: p.id,
        body: p.body,
        createdAt: p.createdAt.toISOString(),
        authorId: p.author.id,
        authorName: p.author.name,
        cityName: p.city?.nameEn ?? null,
        likeCount: p.likeCount,
        liked: likedSet.has(p.id),
      }))}
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
