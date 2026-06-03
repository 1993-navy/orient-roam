"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type Convo = {
  id: string;
  title: string;
  lastMessage: string | null;
  lastAt: string | null;
};

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

export function ChatView({
  me,
  conversations,
  otherUsers,
}: {
  me: string;
  conversations: Convo[];
  otherUsers: { id: string; name: string }[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  // Poll the active conversation every 4s (real-time push is a later iteration).
  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const body = draft;
    setDraft("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, body }),
    });
    loadMessages(activeId);
  }

  async function startChat(targetUserId: string) {
    if (!targetUserId) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (data.id) {
      setActiveId(data.id);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t.chat}</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <aside className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <select
            onChange={(e) => {
              startChat(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
            className="mb-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-neutral-950"
          >
            <option value="">+ New chat with…</option>
            {otherUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <ul className="space-y-1">
            {conversations.length === 0 && (
              <li className="px-2 py-3 text-sm text-neutral-400">No conversations yet.</li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${activeId === c.id ? "bg-rose-50 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                >
                  <div className="font-medium">{c.title}</div>
                  {c.lastMessage && (
                    <div className="truncate text-xs text-neutral-400">{c.lastMessage}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread */}
        <section className="flex h-[60vh] flex-col rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
              Select or start a conversation.
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.senderId === me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-rose-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
                      >
                        {!mine && <div className="text-[11px] font-semibold opacity-70">{m.senderName}</div>}
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-black/5 p-3 dark:border-white/10">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t.typeMessage}
                  className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
                />
                <button className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                  {t.send}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
