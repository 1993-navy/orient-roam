"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/Icon";

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

function initial(name: string) {
  return (name || "?").charAt(0).toUpperCase();
}

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// WeChat-style rounded-square avatar with the contact's initial.
function Avatar({ name, className = "h-10 w-10" }: { name: string; className?: string }) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-lg bg-gradient-to-br from-rose-200 to-orange-200 text-sm font-bold text-neutral-700 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-200 ${className}`}
    >
      {initial(name)}
    </span>
  );
}

// WeChat-style messenger: a conversation list and a thread. On mobile only one
// is shown at a time (tap a chat → thread, back arrow → list); on desktop both
// sit side by side. Outgoing bubbles use the signature WeChat green.
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

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
    <div className="mx-auto h-[80dvh] max-w-5xl md:h-[78dvh] md:px-4 md:py-4">
      <div className="grid h-full overflow-hidden border-black/5 md:grid-cols-[320px_1fr] md:rounded-2xl md:border md:shadow-sm dark:border-white/10">
        {/* Conversation list */}
        <aside
          className={`${activeId ? "hidden md:flex" : "flex"} h-full min-h-0 flex-col border-black/5 bg-white md:border-r dark:border-white/10 dark:bg-neutral-900`}
        >
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
            <h1 className="text-lg font-bold">{t.chat}</h1>
            <select
              onChange={(e) => {
                startChat(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              aria-label={t.newChat}
              className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium dark:border-white/15 dark:bg-neutral-950"
            >
              <option value="">＋ {t.newChat}</option>
              {otherUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-400">{t.noConversations}</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    activeId === c.id
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <Avatar name={c.title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="flex-none text-xs text-neutral-400">
                        {fmtTime(c.lastAt)}
                      </span>
                    </div>
                    <div className="truncate text-sm text-neutral-400">
                      {c.lastMessage ?? ""}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section
          className={`${activeId ? "flex" : "hidden md:flex"} h-full min-h-0 flex-col bg-neutral-100 dark:bg-neutral-950`}
        >
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
              {t.selectConversation}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-black/5 bg-white px-3 py-3 dark:border-white/10 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="rounded-full p-1.5 hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
                  aria-label="Back"
                >
                  <Icon name="back" className="h-5 w-5" />
                </button>
                <span className="truncate font-semibold">{activeConvo?.title}</span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
                {messages.map((m) => {
                  const mine = m.senderId === me;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar name={m.senderName} className="h-8 w-8" />
                      <div className="flex max-w-[72%] flex-col gap-0.5">
                        {!mine && (
                          <span className="px-1 text-[11px] text-neutral-400">
                            {m.senderName}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                            mine
                              ? "bg-[#95ec69] text-neutral-900"
                              : "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={send}
                className="flex gap-2 border-t border-black/5 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t.typeMessage}
                  className="flex-1 rounded-full border border-black/10 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
                />
                <button className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
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
