import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function isMember(conversationId: string, userId: string) {
  const m = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(m);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  
  if (!conversationId || !(await isMember(conversationId, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let lastMessageId: string | null = null;

      const checkForNewMessages = async () => {
        const latest = await prisma.message.findMany({
          where: { 
            conversationId,
            ...(lastMessageId ? { id: { gt: lastMessageId } } : {})
          },
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true } } },
        });

        if (latest.length > 0) {
          lastMessageId = latest[latest.length - 1].id;
          for (const msg of latest) {
            sendEvent({
              type: "new_message",
              message: {
                id: msg.id,
                body: msg.body,
                senderId: msg.senderId,
                senderName: msg.sender.name,
                createdAt: msg.createdAt.toISOString(),
              },
            });
          }
        }
      };

      await checkForNewMessages();

      const interval = setInterval(checkForNewMessages, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}