import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { placeLikeSchema } from "@/lib/validations";

// POST /api/places/like — toggle the current user's like on a place and return
// the authoritative { liked, likeCount } so the optimistic UI can reconcile.
// Mirrors /api/posts/like.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = placeLikeSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { placeId } = parsed.data;
  const userId = session.user.id;

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.placeLike.findUnique({
      where: { placeId_userId: { placeId, userId } },
    });
    let liked: boolean;
    if (existing) {
      await tx.placeLike.delete({ where: { placeId_userId: { placeId, userId } } });
      liked = false;
    } else {
      await tx.placeLike.create({ data: { placeId, userId } });
      liked = true;
    }
    const likeCount = await tx.placeLike.count({ where: { placeId } });
    await tx.place.update({ where: { id: placeId }, data: { likeCount } });
    return { liked, likeCount };
  });

  return NextResponse.json({ ok: true, ...result });
}
