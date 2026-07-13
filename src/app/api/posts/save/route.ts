import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/posts/save — toggle the current user's collect (收藏) on a post and
// return the authoritative { saved, saveCount } so the optimistic UI reconciles.
// Mirrors /api/posts/like.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const postId: unknown = data?.postId;
  if (typeof postId !== "string") {
    return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  }
  const userId = session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.postSave.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    let saved: boolean;
    if (existing) {
      await tx.postSave.delete({ where: { postId_userId: { postId, userId } } });
      saved = false;
    } else {
      await tx.postSave.create({ data: { postId, userId } });
      saved = true;
    }
    const saveCount = await tx.postSave.count({ where: { postId } });
    await tx.post.update({ where: { id: postId }, data: { saveCount } });
    return { saved, saveCount };
  });

  return NextResponse.json({ ok: true, ...result });
}
