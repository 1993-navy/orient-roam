import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/group-chat { kind: "meetup" | "pool", id }
// Create-or-open the group chat tied to a meetup/pool. Only participants may
// call it. First caller creates the conversation with all current members and
// stores its id back on the meetup/pool; later callers just join the thread.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;
  const data = await req.json().catch(() => null);
  const kind: unknown = data?.kind;
  const id: unknown = data?.id;
  if ((kind !== "meetup" && kind !== "pool") || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Load entity + current participants, normalized to a common shape.
  let title: string;
  let ownerId: string;
  let memberIds: string[];
  let conversationId: string | null;

  if (kind === "meetup") {
    const m = await prisma.meetup.findUnique({
      where: { id },
      include: { participants: { where: { status: "joined" }, select: { userId: true } } },
    });
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
    title = m.title;
    ownerId = m.hostId;
    conversationId = m.conversationId;
    memberIds = [m.hostId, ...m.participants.map((p) => p.userId)];
  } else {
    const p = await prisma.groupPool.findUnique({
      where: { id },
      include: { members: { where: { status: "joined" }, select: { userId: true } } },
    });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    title = p.title;
    ownerId = p.organizerId;
    conversationId = p.conversationId;
    memberIds = [p.organizerId, ...p.members.map((m) => m.userId)];
  }

  const participants = new Set(memberIds);
  if (!participants.has(me)) {
    return NextResponse.json(
      { error: "Only participants can open the group chat." },
      { status: 403 },
    );
  }

  // Already created → make sure the caller is a member, then return it.
  if (conversationId) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: me } },
      create: { conversationId, userId: me, role: me === ownerId ? "admin" : "member" },
      update: {},
    });
    return NextResponse.json({ id: conversationId });
  }

  // First time → create the group with everyone and link it back.
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      title,
      members: {
        create: [...participants].map((userId) => ({
          userId,
          role: userId === ownerId ? "admin" : "member",
        })),
      },
    },
  });

  if (kind === "meetup") {
    await prisma.meetup.update({ where: { id }, data: { conversationId: conversation.id } });
  } else {
    await prisma.groupPool.update({ where: { id }, data: { conversationId: conversation.id } });
  }

  return NextResponse.json({ id: conversation.id });
}
