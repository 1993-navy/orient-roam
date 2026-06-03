import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { favoriteSchema } from "@/lib/validations";

// Toggle a favorite (收藏/想去). Returns { active } reflecting the new state so
// the client can reconcile its optimistic update.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { placeId, kind } = parsed.data;
  const userId = session.user.id;
  const where = { userId_placeId_kind: { userId, placeId, kind } };

  const existing = await prisma.favorite.findUnique({ where });
  if (existing) {
    await prisma.favorite.delete({ where });
    return NextResponse.json({ active: false });
  }
  await prisma.favorite.create({ data: { userId, placeId, kind } });
  return NextResponse.json({ active: true });
}

// List the current user's favorites (optionally filtered by ?kind=save|wish).
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const kind = new URL(req.url).searchParams.get("kind") ?? undefined;
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, ...(kind ? { kind } : {}) },
    select: { placeId: true, kind: true },
  });
  return NextResponse.json({ favorites });
}
