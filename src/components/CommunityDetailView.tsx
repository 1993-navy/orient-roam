"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Avatar } from "@/components/Avatar";
import { XButton } from "@/components/XButton";
import { HashtagText } from "@/lib/hashtags";
import { MEETUP_TYPE_LABELS } from "@/lib/i18n";

type Member = {
  id: string;
  name: string;
  joinedAt: string;
};

type Post = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

type Meetup = {
  id: string;
  type: string;
  title: string;
  hostName: string;
  participantCount: number;
  maxPeople: number;
};

type Message = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

type ConversationMember = {
  id: string;
  name: string;
  role: string;
};

type Conversation = {
  id: string;
  title: string | null;
  messages: Message[];
  members: ConversationMember[];
};

export function CommunityDetailView({
  community,
  isAuthed,
  isJoined,
  isOwner,
  posts,
  meetups,
  conversation,
}: {
  community: {
    id: string;
    name: string;
    description: string | null;
    cityId: string | null;
    cityName: string | null;
    ownerId: string;
    ownerName: string;
    members: Member[];
  };
  isAuthed: boolean;
  isJoined: boolean;
  isOwner: boolean;
  posts: Post[];
  meetups: Meetup[];
  conversation: Conversation | null;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "members" | "chat">("home");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;
    const res = await fetch(`/api/messages?conversationId=${conversation.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [conversation?.id]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [activeTab, loadMessages]);

  async function handleJoin() {
    if (!isAuthed || isJoined || busy) return;
    setBusy(true);
    await fetch("/api/communities/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId: community.id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !conversation?.id) return;
    const body = draft;
    setDraft("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id, body }),
    });
    loadMessages();
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleDateString();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar name={community.name} className="h-16 w-16 text-xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{community.name}</h1>
              {community.cityName && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  📍 {community.cityName}
                </span>
              )}
            </div>
            {community.description && (
              <p className="mt-2 text-sm text-neutral-500">{community.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
              <span>👤 {community.ownerName}</span>
              <span>👥 {community.members.length} members</span>
            </div>
          </div>
          {isAuthed && !isJoined && (
            <XButton
              variant="primary"
              size="md"
              disabled={busy}
              onClick={handleJoin}
            >
              {busy ? "..." : t.join}
            </XButton>
          )}
          {isJoined && (
            <XButton
              variant="secondary"
              size="md"
            >
              ✓ {t.joined}
            </XButton>
          )}
        </div>

        <div className="mt-4 flex border-b border-neutral-100">
          {[
            { key: "home", label: "Home" },
            { key: "members", label: `Members (${community.members.length})` },
            { key: "chat", label: "Chat" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-rose-600 text-rose-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "home" && (
          <div className="space-y-6">
            {posts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold">Recent Posts</h2>
                <div className="mt-3 space-y-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="card p-4 animate-fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={post.authorName} className="h-8 w-8 text-sm" />
                        <div>
                          <Link
                            href={`/profile/${post.authorId}`}
                            className="font-semibold text-sm hover:text-rose-600"
                          >
                            {post.authorName}
                          </Link>
                          <span className="ml-2 text-xs text-neutral-400">
                            {fmtTime(post.createdAt)}
                          </span>
                        </div>
                      </div>
                      <HashtagText
                        text={post.body}
                        className="mt-2 text-sm text-neutral-700"
                      />
                    </article>
                  ))}
                </div>
              </div>
            )}

            {meetups.length > 0 && (
              <div>
                <h2 className="text-lg font-bold">Upcoming Meetups</h2>
                <div className="mt-3 space-y-3">
                  {meetups.map((m) => {
                    const label = MEETUP_TYPE_LABELS[m.type];
                    return (
                      <article
                        key={m.id}
                        className="card p-4 animate-fade-in"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-rose-600">
                            {label?.emoji} {label?.en}
                          </span>
                          <Link
                            href={`/meetup/${m.id}`}
                            className="font-semibold hover:text-rose-600"
                          >
                            {m.title}
                          </Link>
                        </div>
                        <div className="mt-1 text-xs text-neutral-400">
                          Host: {m.hostName} · {m.participantCount}/{m.maxPeople} spots
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {community.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 card p-3 animate-fade-in"
              >
                <Avatar name={member.name} className="h-10 w-10 text-sm" />
                <div className="flex-1">
                  <Link
                    href={`/profile/${member.id}`}
                    className="font-semibold hover:text-rose-600"
                  >
                    {member.name}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    Joined {fmtTime(member.joinedAt)}
                  </p>
                </div>
                {member.id === community.ownerId && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-[60vh] flex flex-col card">
            {!isJoined ? (
              <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
                Join the community to start chatting!
              </div>
            ) : !conversation ? (
              <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
                No conversation yet. Start one!
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                  <span className="font-semibold">{conversation.title}</span>
                  <span className="text-xs text-neutral-400">
                    {conversation.members.length} members
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-end gap-2 animate-fade-in"
                    >
                      <Avatar name={msg.senderName} className="h-8 w-8 text-sm" />
                      <div className="flex max-w-[72%] flex-col gap-0.5">
                        <span className="px-1 text-[11px] text-neutral-400">
                          {msg.senderName}
                        </span>
                        <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm">
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={sendMessage}
                  className="flex gap-2 border-t border-neutral-100 p-3"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-rose-400"
                  />
                  <XButton variant="primary" size="sm" type="submit">
                    Send
                  </XButton>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}