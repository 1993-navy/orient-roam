"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

type TripItem = { id: string; title: string; cityName: string | null; stopCount: number };

export function TripsView({
  cities,
  trips,
}: {
  cities: { id: string; nameEn: string }[];
  trips: TripItem[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cityId, setCityId] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, cityId }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json().catch(() => null);
      if (d?.id) router.push(`/trips/${d.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">🧭 {t.trips}</h1>

      <form onSubmit={create} className="mt-4 card p-4">
        <h2 className="text-sm font-semibold">{t.newTrip}</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.tripTitle}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
        />
        <div className="mt-2 flex gap-2">
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-neutral-950"
          >
            <option value="">{t.anyCity}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !title.trim()}
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {t.createTrip}
          </button>
        </div>
      </form>

      <ul className="mt-6 space-y-3">
        {trips.length === 0 ? (
          <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
            {t.noTrips}
          </p>
        ) : (
          trips.map((tr) => (
            <li key={tr.id}>
              <Link
                href={`/trips/${tr.id}`}
                className="flex items-center justify-between card p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="min-w-0">
                  <span className="font-semibold">{tr.title}</span>
                  {tr.cityName && (
                    <span className="ml-2 text-xs text-neutral-400">{tr.cityName}</span>
                  )}
                </div>
                <span className="flex-none text-xs text-neutral-400">{tr.stopCount} 📍</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
