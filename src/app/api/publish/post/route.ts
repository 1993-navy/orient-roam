import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publishPostSchema, publishPostDraftSchema } from "@/lib/validations";
import { parseHashtags } from "@/lib/hashtags";
import { screenContentAI } from "@/lib/moderation";


// POST /api/publish/post — a signed-in user publishes a travel diary, photo set,
// or video. Created with moderationStatus = "pending"; it only appears in the
// community feed once an admin approves it. Text is screened up front by the
// automatic content filter; #hashtags are linked to the shared Tag table.
//
// When the request body carries `?draft=1` (or `draft: true`), the submission is
// instead saved with moderationStatus = "draft": validation is relaxed (any
// field may be empty), the AI screen is skipped, and it never shows publicly.
// Passing an existing `id` updates that draft in place (used both for autosave
// and for "publish this draft").
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to publish." }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const raw = await req.json().catch(() => null);
  const isDraft = url.searchParams.get("draft") === "1" || raw?.draft === true;

  if (isDraft) {
    return saveDraft(raw, userId);
  }

  const parsed = publishPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { kind, title, body, cityId, media } = parsed.data;
  // A draft being promoted to publish carries its own id so we update in place.
  const draftId = typeof raw?.id === "string" && raw.id ? raw.id : null;

  const screen = await screenContentAI(title, body);

  if (!screen.ok) {
    return NextResponse.json(
      { error: screen.reason, category: screen.category },
      { status: 400 },
    );
  }

  const post = await prisma.$transaction(async (tx) => {
    // Promoting an existing draft: verify ownership, then flip it to pending and
    // rewrite its media/tags. Otherwise create a fresh pending post.
    let created;
    if (draftId) {
      const existing = await tx.post.findUnique({
        where: { id: draftId },
        select: { authorId: true, moderationStatus: true },
      });
      if (!existing || existing.authorId !== userId || existing.moderationStatus !== "draft") {
        throw new NotOwnDraftError();
      }
      created = await tx.post.update({
        where: { id: draftId },
        data: {
          kind,
          title: title || null,
          body: body || "",
          cityId: cityId || null,
          moderationStatus: "pending",
        },
      });
      await tx.postMedia.deleteMany({ where: { postId: draftId } });
      await tx.postTag.deleteMany({ where: { postId: draftId } });
    } else {
      created = await tx.post.create({
        data: {
          authorId: userId,
          kind,
          title: title || null,
          body: body || "",
          cityId: cityId || null,
          moderationStatus: "pending",
        },
      });
    }

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
  }).catch((e) => {
    if (e instanceof NotOwnDraftError) return null;
    throw e;
  });

  if (!post) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    id: post.id,
    status: "pending",
    createdAt: post.createdAt,
  });
}

class NotOwnDraftError extends Error {}

// Save (create or update) a draft post. No content screen, relaxed validation.
async function saveDraft(raw: unknown, userId: string) {
  const parsed = publishPostDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { id, kind, title, body, cityId, media } = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    let saved;
    if (id) {
      const existing = await tx.post.findUnique({
        where: { id },
        select: { authorId: true, moderationStatus: true },
      });
      if (!existing || existing.authorId !== userId || existing.moderationStatus !== "draft") {
        throw new NotOwnDraftError();
      }
      saved = await tx.post.update({
        where: { id },
        data: {
          kind,
          title: title || null,
          body: body || "",
          cityId: cityId || null,
        },
      });
      await tx.postMedia.deleteMany({ where: { postId: id } });
    } else {
      saved = await tx.post.create({
        data: {
          authorId: userId,
          kind,
          title: title || null,
          body: body || "",
          cityId: cityId || null,
          moderationStatus: "draft",
        },
      });
    }

    if (media.length > 0) {
      await tx.postMedia.createMany({
        data: media.map((m, i) => ({
          postId: saved.id,
          url: m.url,
          type: m.type,
          position: i,
        })),
      });
    }
    return saved;
  }).catch((e) => {
    if (e instanceof NotOwnDraftError) return null;
    throw e;
  });

  if (!post) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: post.id, status: "draft" });
}
