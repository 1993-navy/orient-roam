import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dishReviewSchema } from "@/lib/validations";
import { recalcDishAggregates } from "@/lib/dishes";
import { checkText } from "@/lib/moderation";

// Upsert the current user's review of a dish, recomputing the dish's cached
// aggregates in the same transaction — mirrors /api/reviews for places.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to review." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = dishReviewSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { dishId, rating, comment, mustTry } = parsed.data;
  const flag = checkText(comment);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.dishReview.upsert({
      where: { userId_dishId: { userId, dishId } },
      create: { userId, dishId, rating, comment: comment || null, mustTry },
      update: { rating, comment: comment || null, mustTry },
    });
    await recalcDishAggregates(dishId, tx);
  });

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    select: { avgRating: true, reviewCount: true, mustTryCount: true },
  });

  return NextResponse.json({ ok: true, dish });
}
