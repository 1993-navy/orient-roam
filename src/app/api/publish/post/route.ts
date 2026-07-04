import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publishPostSchema } from "@/lib/validations";
import { parseHashtags } from "@/lib/hashtags";
import { screenContent } from "@/lib/moderation";

// POST /api/publish/post — a signed-in user publishes a travel diary, photo set,
// or video. Created with moderationStatus = "pending"; it only appears in the
// community feed once an admin approves it. Text is screened up front by the
// automatic content filter; #hashtags are linked to the shared Tag table.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to publish." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = publishPostSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { kind, title, body, cityId, media } = parsed.data;

  const screen = screenContent(title, body);
  if (!screen.ok) {
    return NextResponse.json(
      { error: screen.reason, category: screen.category },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        authorId: userId,
        kind,
        title: title || null,
        body: body || "",
        cityId: cityId || null,
        moderationStatus: "pending",
      },
    });

    if (media.length > 0) {
      await tx.postMedia.createMany({
        data: media.map((m, i) => ({
          postId: created.id,
          url: m.url,
          type: m.type,
          position: i,
        })),
      });
    }

    const tags = parseHashtags(body || "");
    if (tags.length > 0) {
      await Promise.all(
        tags.map((name) =>
          tx.tag.upsert({ where: { name }, create: { name }, update: {} }),
        ),
      );
      const tagRows = await tx.tag.findMany({
        where: { name: { in: tags } },
        select: { id: true },
      });
      await tx.postTag.createMany({
        data: tagRows.map((tg) => ({ postId: created.id, tagId: tg.id })),
      });
    }

    return created;
  });

  return NextResponse.json({
    ok: true,
    id: post.id,
    status: "pending",
    createdAt: post.createdAt,
  });
}
