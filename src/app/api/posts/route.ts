import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations";
import { parseHashtags } from "@/lib/hashtags";
import { getUserPostLikes, getUserPostSaves } from "@/lib/posts";

import { createCachedResponse } from "@/lib/cache";
import { checkText } from "@/lib/moderation";

const DEFAULT_TAKE = 15;
const MAX_TAKE = 50;

// GET /api/posts?skip=&take=&city=&tag=
// Newest-first community feed, offset-paginated. Each post carries the current
// user's `liked` flag so cards appended via infinite scroll match the SSR page.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city") || undefined;
  const tag = searchParams.get("tag")?.trim().toLowerCase() || undefined;
  const skip = Math.max(0, Number(searchParams.get("skip")) || 0);
  const take = Math.min(
    MAX_TAKE,
    Math.max(1, Number(searchParams.get("take")) || DEFAULT_TAKE),
  );

  const where: Prisma.PostWhereInput = {
    hidden: false,
    moderationStatus: "approved",
    ...(cityId ? { cityId } : {}),

    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
  };

  const rows = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      city: { select: { nameEn: true } },
      media: { orderBy: { position: "asc" }, select: { url: true, type: true } },
    },
    skip,
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const ids = page.map((p) => p.id);
  const [liked, savedSet] = await Promise.all([
    getUserPostLikes(ids),
    getUserPostSaves(ids),
  ]);

  const result = {
    posts: page.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      media: p.media,
      createdAt: p.createdAt,
      authorId: p.author.id,
      authorName: p.author.name,
      cityName: p.city?.nameEn ?? null,
      likeCount: p.likeCount,
      liked: liked.has(p.id),
      saveCount: p.saveCount,
      saved: savedSet.has(p.id),
      shareCount: p.shareCount,
      commentCount: p.commentCount,
    })),
    hasMore,
  };


  return createCachedResponse(result, {
    maxAge: 30,
    staleWhileRevalidate: 120,
    cachePrivate: true,
  });
}

// POST /api/posts — create a post; #hashtags in the body are linked to Tag
// (reusing the same Tag table as reviews), all in one transaction.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to post." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { body, cityId } = parsed.data;
  const flag = checkText(body);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });
  const userId = session.user.id;

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: { authorId: userId, body, cityId: cityId || null },
    });

    const tags = parseHashtags(body);
    if (tags.length > 0) {
      await Promise.all(
        tags.map((name) =>
          tx.tag.upsert({ where: { name }, create: { name }, update: {} }),
        ),
      );
      const tagRows = await tx.tag.findMany({
        where: { name: { in: tags } },
        select: { id: true },
      });
      await tx.postTag.createMany({
        data: tagRows.map((tg) => ({ postId: created.id, tagId: tg.id })),
      });
    }

    return created;
  });

  return NextResponse.json({
    ok: true,
    id: post.id,
    createdAt: post.createdAt,
  });
}
