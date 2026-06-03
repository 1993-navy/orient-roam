import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";

async function isMember(conversationId: string, userId: string) {
  const m = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(m);
}

// GET /api/messages?conversationId=...   (polled by the chat UI)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const conversationId = new URL(req.url).searchParams.get("conversationId");
  if (!conversationId || !(await isMember(conversationId, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
    take: 200,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      senderName: m.sender.name,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// POST /api/messages  { conversationId, body }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!(await isMember(parsed.data.conversationId, session.user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: parsed.data.conversationId,
      senderId: session.user.id,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ ok: true, id: message.id });
}
