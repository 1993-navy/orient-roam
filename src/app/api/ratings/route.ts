import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/ratings  { ratedId, rating, comment?, meetupId? }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const ratedId: unknown = data?.ratedId;
  const rating: unknown = data?.rating;
  const comment: unknown = data?.comment;
  const meetupId: unknown = data?.meetupId;

  if (typeof ratedId !== "string") {
    return NextResponse.json({ error: "Invalid rated user ID" }, { status: 400 });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  if (ratedId === session.user.id) {
    return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
  }

  const ratedUser = await prisma.user.findUnique({ where: { id: ratedId } });
  if (!ratedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingRating = await prisma.userRating.findUnique({
    where: { raterId_ratedId: { raterId: session.user.id, ratedId } },
  });

  const newRating = await prisma.userRating.upsert({
    where: { raterId_ratedId: { raterId: session.user.id, ratedId } },
    create: {
      raterId: session.user.id,
      ratedId,
      rating,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : undefined,
      meetupId: typeof meetupId === "string" && meetupId ? meetupId : undefined,
    },
    update: {
      rating,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : undefined,
    },
  });

  const ratings = await prisma.userRating.findMany({ where: { ratedId } });
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / ratings.length;

  await prisma.user.update({
    where: { id: ratedId },
    data: {
      avgRating: parseFloat(avgRating.toFixed(1)),
      ratingCount: ratings.length,
    },
  });

  return NextResponse.json({ ok: true, id: newRating.id });
}

// GET /api/ratings?userId=...
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const ratings = await prisma.userRating.findMany({
    where: { ratedId: userId },
    include: {
      rater: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ratings: ratings.map((r) => ({
      id: r.id,
      raterId: r.raterId,
      raterName: r.rater.name,
      rating: r.rating,
      comment: r.comment,
      meetupId: r.meetupId,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}