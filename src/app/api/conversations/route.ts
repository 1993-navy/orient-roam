import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/conversations  { targetUserId }
// Finds an existing 1:1 conversation between the two users, or creates one.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const targetUserId: unknown = data?.targetUserId;
  if (typeof targetUserId !== "string" || targetUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Look for an existing 1:1 conversation containing exactly these two users.
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: session.user.id } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId: session.user.id }, { userId: targetUserId }],
      },
    },
  });

  return NextResponse.json({ id: conversation.id });
}
