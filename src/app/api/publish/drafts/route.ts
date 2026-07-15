import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/publish/drafts — list the current user's saved drafts (both post
// drafts: diary/photo/video, and place drafts: restaurant/attraction). Used by
// the "unfinished drafts" strip at the top of the publish page.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const userId = session.user.id;

  const [posts, places] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, moderationStatus: "draft" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        cityId: true,
        updatedAt: true,
        media: { select: { url: true, type: true }, orderBy: { position: "asc" } },
      },
    }),
    prisma.place.findMany({
      where: { submittedById: userId, moderationStatus: "draft" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        name: true,
        nameEn: true,
        cityId: true,
        lat: true,
        lng: true,
        address: true,
        description: true,
        priceLevel: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({ ...p, kind: p.kind as "DIARY" | "PHOTO" | "VIDEO" })),
    places,
  });
}

// DELETE /api/publish/drafts?type=post|place&id=... — discard one draft.
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  if (!id || (type !== "post" && type !== "place")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (type === "post") {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, moderationStatus: true },
    });
    if (!existing || existing.authorId !== userId || existing.moderationStatus !== "draft") {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    await prisma.post.delete({ where: { id } });
  } else {
    const existing = await prisma.place.findUnique({
      where: { id },
      select: { submittedById: true, moderationStatus: true },
    });
    if (!existing || existing.submittedById !== userId || existing.moderationStatus !== "draft") {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    await prisma.place.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
