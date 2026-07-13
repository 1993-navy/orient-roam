import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postCommentSchema } from "@/lib/validations";
import { checkText } from "@/lib/moderation";

// GET /api/posts/comments?postId=... — list a post's visible comments (oldest
// first, capped). No auth required.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  }

  const comments = await prisma.postComment.findMany({
    where: { postId, hidden: false },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    ok: true,
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      userId: c.user.id,
      userName: c.user.name,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// POST /api/posts/comments — add a comment to a post and return the created
// comment plus the authoritative commentCount. Mirrors the review write flow:
// auth → validate → moderation → transaction (create + recompute count).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to comment." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = postCommentSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { postId, body } = parsed.data;
  const flag = checkText(body);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });
  const userId = session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { comment, commentCount } = await prisma.$transaction(async (tx) => {
    const comment = await tx.postComment.create({
      data: { postId, userId, body },
      include: { user: { select: { id: true, name: true } } },
    });
    const commentCount = await tx.postComment.count({
      where: { postId, hidden: false },
    });
    await tx.post.update({ where: { id: postId }, data: { commentCount } });
    return { comment, commentCount };
  });

  return NextResponse.json({
    ok: true,
    commentCount,
    comment: {
      id: comment.id,
      body: comment.body,
      userId: comment.user.id,
      userName: comment.user.name,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
