"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { biLabel, MEETUP_TYPE_LABELS, FOREIGNER_TAG_LABELS } from "@/lib/i18n";

import { Avatar } from "@/components/Avatar";

type Meetup = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  cityName: string | null;
  cityNameZh: string | null;
  placeId: string | null;
  placeName: string | null;
  placeForeignerTags?: string[];
  hostId: string;
  hostName: string;
  startTime: string | null;
  endTime: string | null;
  maxPeople: number;
  currentPeople: number;
  recurrence: string;
  recurrenceDay: number | null;
  status: string;
};

export function MeetupCard({ meetup }: { meetup: Meetup }) {
  const { t, locale } = useLang();
  const label = MEETUP_TYPE_LABELS[meetup.type];
  const isFull = meetup.currentPeople >= meetup.maxPeople;

  function formatTime(iso: string | null) {
    if (!iso) return null;
    const date = new Date(iso);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRecurrence() {
    if (meetup.recurrence === "none") return null;
    if (meetup.recurrence === "weekly") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return `Every ${days[(meetup.recurrenceDay || 1) - 1]}`;
    }
    if (meetup.recurrence === "monthly") {
      return `Every ${meetup.recurrenceDay}th`;
    }
    return null;
  }

  return (
    <article className="card p-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <Avatar name={meetup.hostName} className="h-12 w-12" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
              {label?.emoji} {label?.en}
            </span>
            {meetup.cityName && (
              <span className="text-xs text-neutral-500">{meetup.cityName}</span>
            )}
            {formatRecurrence() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                🔄 {formatRecurrence()}
              </span>
            )}
          </div>

          <h3 className="mt-1 text-lg font-semibold">
            <Link href={`/meetup/${meetup.id}`} className="hover:text-rose-600">
              {meetup.title}
            </Link>
          </h3>

          {meetup.description && (
            <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
              {meetup.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            {meetup.startTime && (
              <span>🕒 {formatTime(meetup.startTime)}</span>
            )}
            {meetup.placeName && (
              <span>
                📍{" "}
                {meetup.placeId ? (
                  <Link href={`/place/${meetup.placeId}`} className="hover:text-rose-600">
                    {meetup.placeName}
                  </Link>
                ) : (
                  meetup.placeName
                )}
              </span>
            )}
            <span>👤 {meetup.currentPeople}/{meetup.maxPeople}</span>
            {isFull && (
              <span className="text-red-500 font-semibold">{t.full}</span>
            )}
          </div>

          {/* Restaurant's foreigner-friendly tags — surfaced right on the meetup */}
          {meetup.placeForeignerTags && meetup.placeForeignerTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {meetup.placeForeignerTags.slice(0, 4).map((tag) => {
                const label = FOREIGNER_TAG_LABELS[tag];
                if (!label) return null;
                return (
                  <span
                    key={tag}
                    title={biLabel(label, locale)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <span aria-hidden="true">{label.emoji}</span>
                    <span>{biLabel(label, locale)}</span>

                  </span>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href={`/meetup/${meetup.id}`}
          className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {isFull ? "View" : t.join}
        </Link>
      </div>
    </article>
  );
}