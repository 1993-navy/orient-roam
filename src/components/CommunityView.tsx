"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { MEETUP_TYPE_LABELS } from "@/lib/i18n";
import { CommunityFeed } from "@/components/CommunityFeed";
import { MessageButton } from "@/components/MessageButton";
import type { PostCardData } from "@/components/PostCard";

type Meetup = {
  id: string;
  hostId: string;
  type: string;
  title: string;
  description: string | null;
  cityName: string | null;
  placeName: string | null;
  hostName: string;
  participantCount: number;
  maxPeople: number;
  joined: boolean;
};

type Community = {
  id: string;
  name: string;
  description: string | null;
  cityName: string | null;
  memberCount: number;
  joined: boolean;
};

export function CommunityView({
  isAuthed,
  meId,
  cities,
  communities,
  meetups,
  initialPosts,
  initialHasMore,
}: {
  isAuthed: boolean;
  meId: string | null;
  cities: { id: string; nameEn: string }[];
  communities: Community[];
  meetups: Meetup[];
  initialPosts: PostCardData[];
  initialHasMore: boolean;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function post(url: string, body: object, key: string) {
    setBusy(key);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t.community}</h1>
      {!isAuthed && (
        <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Link href="/auth/signin" className="font-semibold underline">
            {t.loginToChat}
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Feed (main column) */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">📣 {t.feed}</h2>
          <CommunityFeed
            isAuthed={isAuthed}
            cities={cities}
            initialPosts={initialPosts}
            initialHasMore={initialHasMore}
          />
        </div>

        {/* Sidebar: meetups + communities */}
        <div className="space-y-8 lg:col-span-1">
          {/* Meetups: 拼饭 / 拼单 / 搭子 */}
          <section>
            <h2 className="text-lg font-bold">🤝 拼饭 · 拼单 · 搭子</h2>

            {isAuthed && (
              <CreateMeetupForm
                cities={cities}
                onCreate={(b) => post("/api/meetups", b, "create")}
                busy={busy === "create"}
              />
            )}

            <ul className="mt-4 space-y-3">
              {meetups.map((m) => {
                const label = MEETUP_TYPE_LABELS[m.type];
                const full = m.participantCount >= m.maxPeople;
                return (
                  <li
                    key={m.id}
                    className="card p-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                      <span>
                        {label?.emoji} {label?.en ?? m.type}
                      </span>
                      {m.cityName && <span className="text-neutral-400">· {m.cityName}</span>}
                    </div>
                    <h3 className="mt-1 font-semibold">{m.title}</h3>
                    {m.description && (
                      <p className="text-sm text-neutral-500">{m.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        Host: {m.hostName} {m.placeName ? `· 📍 ${m.placeName}` : ""}
                      </span>
                      <span>
                        {m.participantCount}/{m.maxPeople}
                      </span>
                    </div>
                    {isAuthed && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          disabled={m.joined || full || busy === `join-${m.id}`}
                          onClick={() => post("/api/meetups/join", { meetupId: m.id }, `join-${m.id}`)}
                          className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                        >
                          {m.joined ? "✓ Joined" : full ? "Full" : t.join}
                        </button>
                        {m.hostId !== meId && (
                          <MessageButton
                            targetUserId={m.hostId}
                            className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
                          />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Communities */}
          <section>
            <h2 className="text-lg font-bold">👥 {t.community}</h2>
            <ul className="mt-4 space-y-3">
              {communities.map((c) => (
                <li
                  key={c.id}
                  className="card p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.cityName && <span className="text-xs text-neutral-400">{c.cityName}</span>}
                  </div>
                  {c.description && (
                    <p className="mt-0.5 text-sm text-neutral-500">{c.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {c.memberCount} {t.members}
                    </span>
                    {isAuthed && (
                      <button
                        disabled={c.joined || busy === `cjoin-${c.id}`}
                        onClick={() => post("/api/communities/join", { communityId: c.id }, `cjoin-${c.id}`)}
                        className="rounded-full bg-rose-600 px-4 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                      >
                        {c.joined ? "✓ Joined" : t.join}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function CreateMeetupForm({
  cities,
  onCreate,
  busy,
}: {
  cities: { id: string; nameEn: string }[];
  onCreate: (body: object) => void;
  busy: boolean;
}) {
  const { t } = useLang();
  const [type, setType] = useState("MEAL");
  const [title, setTitle] = useState("");
  const [cityId, setCityId] = useState("");
  const [maxPeople, setMaxPeople] = useState(4);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ type, title, cityId, maxPeople });
        setTitle("");
      }}
      className="mt-3 card p-4"
    >
      <h3 className="text-sm font-semibold">{t.startMeetup}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(MEETUP_TYPE_LABELS).map(([k, v]) => (
          <button
            type="button"
            key={k}
            onClick={() => setType(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${type === k ? "bg-rose-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
          >
            {v.emoji} {v.en}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Split a hotpot tonight"
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
      />
      <div className="mt-2 flex gap-2">
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-neutral-950"
        >
          <option value="">Any city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2}
          max={50}
          value={maxPeople}
          onChange={(e) => setMaxPeople(Number(e.target.value))}
          className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-neutral-950"
        />
      </div>
      <button
        disabled={busy}
        className="mt-2 rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {busy ? "…" : t.startMeetup}
      </button>
    </form>
  );
}
