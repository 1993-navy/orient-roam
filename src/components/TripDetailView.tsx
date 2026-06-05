"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n";

type Stop = {
  id: string;
  day: number;
  placeId: string;
  placeName: string;
  placeNameZh: string;
  category: string;
};

export function TripDetailView({
  isOwner,
  trip,
  stops,
}: {
  isOwner: boolean;
  trip: { id: string; title: string; cityName: string | null };
  stops: Stop[];
}) {
  const { locale, t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const maxDay = stops.reduce((m, s) => Math.max(m, s.day), 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  async function call(method: string, body: object) {
    setBusy(true);
    await fetch("/api/trips/stops", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/trips" className="text-sm text-neutral-500 hover:text-rose-600">
        ← {t.trips}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{trip.title}</h1>
      {trip.cityName && <p className="text-sm text-neutral-400">{trip.cityName}</p>}

      {stops.length === 0 ? (
        <p className="mt-6 rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
          {locale === "zh"
            ? "还没有景点。去景点页点「加入行程」。"
            : "No stops yet. Add places from their page."}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {days.map((day) => {
            const dayStops = stops.filter((s) => s.day === day);
            if (dayStops.length === 0) return null;
            return (
              <section key={day}>
                <h2 className="text-lg font-bold">
                  {locale === "zh" ? `第 ${day} 天` : `Day ${day}`}
                </h2>
                <ul className="mt-2 space-y-2">
                  {dayStops.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 card p-3">
                      <span>{CATEGORY_LABELS[s.category]?.emoji ?? "📍"}</span>
                      <Link
                        href={`/place/${s.placeId}`}
                        className="min-w-0 flex-1 truncate font-medium hover:text-rose-600"
                      >
                        {locale === "zh" ? s.placeNameZh : s.placeName}
                      </Link>
                      {isOwner && (
                        <>
                          <select
                            value={s.day}
                            disabled={busy}
                            onChange={(e) => call("PATCH", { stopId: s.id, day: Number(e.target.value) })}
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs dark:border-white/15 dark:bg-neutral-950"
                          >
                            {Array.from({ length: maxDay + 1 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>
                                {locale === "zh" ? `第${d}天` : `D${d}`}
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={busy}
                            onClick={() => call("DELETE", { stopId: s.id })}
                            title={t.remove}
                            className="text-neutral-400 hover:text-rose-600"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
