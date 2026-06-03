import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { recalcPlaceAggregates } from "@/lib/recommendation";

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
  const userId = session.user.id;

  // Upsert the review and recompute the place's cached weight in one transaction
  // so the recommendation ranking can never drift from the underlying reviews.
  await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: { userId, placeId, rating, comment: comment || null },
      update: { rating, comment: comment || null },
    });
    await recalcPlaceAggregates(placeId, tx);
  });

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { avgRating: true, reviewCount: true, weightScore: true },
  });

  return NextResponse.json({ ok: true, place });
}
