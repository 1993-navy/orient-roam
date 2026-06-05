import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/posts/like — toggle the current user's like on a post and return the
// authoritative { liked, likeCount } so the optimistic UI can reconcile.
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
    const existing = await tx.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    let liked: boolean;
    if (existing) {
      await tx.postLike.delete({ where: { postId_userId: { postId, userId } } });
      liked = false;
    } else {
      await tx.postLike.create({ data: { postId, userId } });
      liked = true;
    }
    const likeCount = await tx.postLike.count({ where: { postId } });
    await tx.post.update({ where: { id: postId }, data: { likeCount } });
    return { liked, likeCount };
  });

  return NextResponse.json({ ok: true, ...result });
}
