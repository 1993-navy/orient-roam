import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/places/share — record a share/repost (转发) of a place. Sharing is a
// fire-and-forget increment (no per-user uniqueness) so anyone, signed in or
// not, can bump the counter. Returns the new count. Mirrors /api/posts/share.
export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const placeId: unknown = data?.placeId;
  if (typeof placeId !== "string") {
    return NextResponse.json({ error: "Invalid place" }, { status: 400 });
  }

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const updated = await prisma.place.update({
    where: { id: placeId },
    data: { shareCount: { increment: 1 } },
    select: { shareCount: true },
  });

  return NextResponse.json({ ok: true, shareCount: updated.shareCount });
}
