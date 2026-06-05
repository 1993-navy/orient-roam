"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { MEETUP_TYPE_LABELS } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import { MessageButton } from "@/components/MessageButton";

type Member = { id: string; name: string };

type MeetupDetail = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  cityName: string | null;
  placeId: string | null;
  placeName: string | null;
  hostId: string;
  hostName: string;
  startTime: string | null;
  maxPeople: number;
};

export function MeetupDetailView({
  meId,
  isJoined,
  isHost,
  members,
  meetup,
}: {
  meId: string | null;
  isJoined: boolean;
  isHost: boolean;
  members: Member[];
  meetup: MeetupDetail;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const label = MEETUP_TYPE_LABELS[meetup.type];
  const full = members.length >= meetup.maxPeople;

  async function act(url: string) {
    setBusy(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetupId: meetup.id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/community" className="text-sm text-neutral-500 hover:text-rose-600">
        ← {t.community}
      </Link>

      <div className="mt-3 card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
          <span>
            {label?.emoji} {label?.en ?? meetup.type}
          </span>
          {meetup.cityName && <span className="text-neutral-400">· {meetup.cityName}</span>}
        </div>
        <h1 className="mt-1 text-2xl font-bold">{meetup.title}</h1>
        {meetup.description && (
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">{meetup.description}</p>
        )}

        <div className="mt-4 space-y-1 text-sm text-neutral-500">
          {meetup.startTime && (
            <p>
              🕒 {t.when}: {new Date(meetup.startTime).toLocaleString()}
            </p>
          )}
          {meetup.placeName && (
            <p>
              📍{" "}
              {meetup.placeId ? (
                <Link href={`/place/${meetup.placeId}`} className="hover:text-rose-600">
                  {meetup.placeName}
                </Link>
              ) : (
                meetup.placeName
              )}
            </p>
          )}
          <p>
            👤{" "}
            <Link href={`/profile/${meetup.hostId}`} className="hover:text-rose-600">
              {meetup.hostName}
            </Link>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!meId && (
            <Link
              href="/auth/signin"
              className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {t.signIn}
            </Link>
          )}
          {meId && isHost && <span className="text-sm text-neutral-400">{t.hosting}</span>}
          {meId && !isHost && !isJoined && (
            <button
              disabled={busy || full}
              onClick={() => act("/api/meetups/join")}
              className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
            >
              {full ? "Full" : t.join}
            </button>
          )}
          {meId && !isHost && isJoined && (
            <button
              disabled={busy}
              onClick={() => act("/api/meetups/leave")}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-white/15 dark:hover:bg-neutral-800"
            >
              {t.leave}
            </button>
          )}
          {meId && !isHost && (
            <MessageButton
              targetUserId={meetup.hostId}
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
            />
          )}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold">
          {t.participants} · {members.length}/{meetup.maxPeople}
        </h2>
        <ul className="mt-3 space-y-2">
          {members.map((u) => (
            <li key={u.id} className="flex items-center gap-3 card p-3">
              <Avatar name={u.name} className="h-9 w-9 text-sm" />
              <Link href={`/profile/${u.id}`} className="font-medium hover:text-rose-600">
                {u.name}
              </Link>
              {u.id === meetup.hostId && (
                <span className="text-xs font-semibold text-rose-600">host</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
