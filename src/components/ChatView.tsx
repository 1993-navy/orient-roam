"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { TRANSLATE_LABELS, biLabel } from "@/lib/i18n";

type Translation = { translated: string; detected: string };
const AUTO_TRANSLATE_KEY = "orient-roam:auto-translate";

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

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatView({
  me,
  conversations,
  otherUsers,
  initialConversationId = null,
}: {
  me: string;
  conversations: Convo[];
  otherUsers: { id: string; name: string }[];
  initialConversationId?: string | null;
}) {
  const { t, locale } = useLang();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId && conversations.some((c) => c.id === initialConversationId)
      ? initialConversationId
      : null,
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-translation state. Original bodies stay in `messages`; translations are
  // kept separately keyed by message id. `shownOriginal` lets a user reveal the
  // original for a message whose translation is showing.
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [shownOriginal, setShownOriginal] = useState<Record<string, boolean>>({});
  const requestedRef = useRef<Set<string>>(new Set());

  // Restore the auto-translate preference once on mount.
  useEffect(() => {
    setAutoTranslate(localStorage.getItem(AUTO_TRANSLATE_KEY) === "1");
  }, []);

  const toggleAutoTranslate = useCallback(() => {
    setAutoTranslate((prev) => {
      const next = !prev;
      localStorage.setItem(AUTO_TRANSLATE_KEY, next ? "1" : "0");
      if (next) requestedRef.current.clear(); // allow re-translation into current locale
      return next;
    });
  }, []);

  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

  const loadMessages = async (conversationId: string) => {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  };

  useEffect(() => {
    if (!activeId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    loadMessages(activeId);

    eventSourceRef.current = new EventSource(`/api/messages/stream?conversationId=${activeId}`);

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.message) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
        }
      } catch (e) {
        console.error("Failed to parse SSE message:", e);
      }
    };

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When locale changes, drop cached translations so messages re-translate into
  // the newly chosen language.
  useEffect(() => {
    requestedRef.current.clear();
    setTranslations({});
  }, [locale]);

  // Fetch translations for other people's messages that we haven't requested yet.
  useEffect(() => {
    if (!autoTranslate) return;
    const pending = messages.filter(
      (m) => m.senderId !== me && m.body.trim() && !requestedRef.current.has(m.id),
    );
    if (pending.length === 0) return;
    pending.forEach((m) => requestedRef.current.add(m.id));

    (async () => {
      try {
        const res = await fetch("/api/messages/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: locale,
            items: pending.map((m) => ({ id: m.id, body: m.body })),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.translations && Object.keys(data.translations).length > 0) {
          setTranslations((prev) => ({ ...prev, ...data.translations }));
        }
      } catch {
        // Network/provider failure — leave originals untranslated, allow retry.
        pending.forEach((m) => requestedRef.current.delete(m.id));
      }
    })();
  }, [messages, autoTranslate, me, locale]);

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
                  <Avatar name={c.title} className="h-10 w-10 text-sm" square />
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
                <button
                  type="button"
                  onClick={toggleAutoTranslate}
                  aria-pressed={autoTranslate}
                  title={biLabel(TRANSLATE_LABELS.autoTranslate, locale)}
                  className={`ml-auto flex flex-none items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    autoTranslate
                      ? "bg-rose-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  <Icon name="globe" className="h-3.5 w-3.5" />
                  {biLabel(TRANSLATE_LABELS.autoTranslate, locale)}
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
                {messages.map((m) => {
                  const mine = m.senderId === me;
                  const tr = translations[m.id];
                  // Show translation as the primary text (original kept below /
                  // revealable) only for other people's messages when we have one.
                  const showTr = !mine && autoTranslate && tr && !shownOriginal[m.id];
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar name={m.senderName} className="h-8 w-8 text-sm" square />
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
                          {showTr ? tr.translated : m.body}
                          {!mine && tr && (
                            <div className="mt-1.5 border-t border-black/5 pt-1.5 dark:border-white/10">
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                {showTr ? m.body : tr.translated}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setShownOriginal((prev) => ({
                                    ...prev,
                                    [m.id]: !prev[m.id],
                                  }))
                                }
                                className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline dark:text-rose-400"
                              >
                                <Icon name="globe" className="h-3 w-3" />
                                {biLabel(
                                  showTr
                                    ? TRANSLATE_LABELS.showOriginal
                                    : TRANSLATE_LABELS.showTranslation,
                                  locale,
                                )}
                              </button>
                            </div>
                          )}
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
