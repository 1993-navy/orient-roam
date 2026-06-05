import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatView } from "@/components/ChatView";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-neutral-500">
          <Link href="/auth/signin" className="font-semibold text-rose-600 hover:underline">
            Sign in to chat →
          </Link>
        </p>
      </div>
    );
  }
  const me = session.user.id;

  const [conversations, otherUsers] = await Promise.all([
    prisma.conversation.findMany({
      where: { members: { some: { userId: me } } },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.user.findMany({
      where: { id: { not: me } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const convos = conversations
    .map((c) => {
      const others = c.members.filter((m) => m.userId !== me).map((m) => m.user.name);
      const last = c.messages[0];
      return {
        id: c.id,
        title: c.title ?? (others.join(", ") || "Chat"),
        lastMessage: last?.body ?? null,
        lastAt: last?.createdAt.toISOString() ?? null,
      };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));

  const sp = await searchParams;
  return (
    <ChatView
      me={me}
      conversations={convos}
      otherUsers={otherUsers}
      initialConversationId={sp.c ?? null}
    />
  );
}
