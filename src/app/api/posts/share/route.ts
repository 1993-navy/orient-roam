import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/posts/share — record a share/repost (转发) of a post. Sharing is a
// fire-and-forget increment (no per-user uniqueness) so anyone, signed in or
// not, can bump the counter when they copy the link. Returns the new count.
export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const postId: unknown = data?.postId;
  if (typeof postId !== "string") {
    return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { shareCount: { increment: 1 } },
    select: { shareCount: true },
  });

  return NextResponse.json({ ok: true, shareCount: updated.shareCount });
}
