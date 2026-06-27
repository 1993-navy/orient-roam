import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/conversations/group  { title, userIds }
// Creates a new group conversation.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const title: unknown = data?.title;
  const userIds: unknown = data?.userIds;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!Array.isArray(userIds) || userIds.length < 2) {
    return NextResponse.json({ error: "At least 2 members required" }, { status: 400 });
  }

  const uniqueUserIds = [...new Set(userIds.filter((id: unknown) => typeof id === "string"))];
  
  if (!uniqueUserIds.includes(session.user.id)) {
    uniqueUserIds.push(session.user.id);
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      title: title.trim(),
      members: {
        create: uniqueUserIds.map((userId) => ({
          userId,
          role: userId === session.user.id ? "admin" : "member",
        })),
      },
    },
  });

  return NextResponse.json({ id: conversation.id, title: conversation.title });
}

// PUT /api/conversations/group/:id/members  { userId }
// Adds a member to a group conversation.
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  
  if (!id) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  const data = await req.json().catch(() => null);
  const userId: unknown = data?.userId;

  if (typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!conversation.isGroup) {
    return NextResponse.json({ error: "Not a group conversation" }, { status: 400 });
  }

  const isAdmin = conversation.members.some(
    (m) => m.userId === session.user.id && m.role === "admin"
  );

  if (!isAdmin) {
    return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
  }

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: id, userId } },
    create: { conversationId: id, userId, role: "member" },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/conversations/group/:id/members  { userId }
// Removes a member from a group conversation.
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  
  if (!id) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  const data = await req.json().catch(() => null);
  const userId: unknown = data?.userId;

  if (typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!conversation.isGroup) {
    return NextResponse.json({ error: "Not a group conversation" }, { status: 400 });
  }

  const isAdmin = conversation.members.some(
    (m) => m.userId === session.user.id && m.role === "admin"
  );

  if (!isAdmin && userId !== session.user.id) {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId: id, userId } },
  });

  return NextResponse.json({ ok: true });
}