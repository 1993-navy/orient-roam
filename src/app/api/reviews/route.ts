import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { recalcPlaceAggregates } from "@/lib/recommendation";
import { parseHashtags } from "@/lib/hashtags";
import { checkText } from "@/lib/moderation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to review." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { placeId, rating, comment } = parsed.data;
  const flag = checkText(comment);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });
  const userId = session.user.id;

  // Upsert the review and recompute the place's cached weight in one transaction
  // so the recommendation ranking can never drift from the underlying reviews.
  await prisma.$transaction(async (tx) => {
    const review = await tx.review.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: { userId, placeId, rating, comment: comment || null },
      update: { rating, comment: comment || null },
    });

    // Sync #hashtags: re-derive this review's tag links from its current text so
    // edits add/remove topics correctly. Kept in the same transaction as the
    // rating aggregate so a topic can never reference a half-written review.
    const tags = parseHashtags(comment);
    await tx.reviewTag.deleteMany({ where: { reviewId: review.id } });
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
      await tx.reviewTag.createMany({
        data: tagRows.map((tg) => ({ reviewId: review.id, tagId: tg.id })),
      });
    }

    await recalcPlaceAggregates(placeId, tx);
  });

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { avgRating: true, reviewCount: true, weightScore: true },
  });

  return NextResponse.json({ ok: true, place });
}
