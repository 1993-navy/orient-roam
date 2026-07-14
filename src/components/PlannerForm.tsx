"use client";

import { useState } from "react";
import Link from "next/link";
import { XButton } from "@/components/XButton";
import {
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  type InterestKey,
  type Itinerary,
  type Pace,
} from "@/lib/planner";

type City = { id: string; name: string; nameEn: string };

const PACE_LABEL: Record<Pace, string> = {
  relaxed: "Relaxed · 2-3 stops/day",
  balanced: "Balanced · 3-4 stops/day",
  packed: "Packed · 4-5 stops/day",
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🥐",
  lunch: "🍚",
  dinner: "🍲",
};

export function PlannerForm({ cities }: { cities: City[] }) {
  const [form, setForm] = useState({
    cityId: "",
    days: 3,
    interests: [] as InterestKey[],
    pace: "balanced" as Pace,
    cuisineLikes: "",
    dietary: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Itinerary | null>(null);

  function toggleInterest(key: InterestKey) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(key)
        ? f.interests.filter((k) => k !== key)
        : [...f.interests, key],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cityId) {
      setError("Please pick a city first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.itinerary) {
        setResult(data.itinerary as Itinerary);
      } else {
        setError(data.error ?? "Could not generate a plan. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950";
  const lbl = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>City</label>
            <select
              value={form.cityId}
              onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              className={field}
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} ({c.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>How many days?</label>
            <input
              type="number"
              min={1}
              max={7}
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
              className={field}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>What do you love? (pick any)</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((o) => {
              const on = form.interests.includes(o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => toggleInterest(o.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  }`}
                >
                  {o.emoji} {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={lbl}>Pace</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {PACE_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, pace: p })}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  form.pace === p
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950"
                    : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                }`}
              >
                {PACE_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>🍜 Food you like</label>
            <input
              value={form.cuisineLikes}
              onChange={(e) => setForm({ ...form, cuisineLikes: e.target.value })}
              placeholder="Sichuan, dumplings, good coffee…"
              className={field}
            />
          </div>
          <div>
            <label className={lbl}>🚫 Dietary limits / dislikes</label>
            <input
              value={form.dietary}
              onChange={(e) => setForm({ ...form, dietary: e.target.value })}
              placeholder="No pork, vegetarian, peanut allergy…"
              className={field}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Anything else? (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Travelling with kids, prefer walking, on a budget…"
            className={`${field} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <XButton variant="primary" size="lg" type="submit" disabled={busy}>
          {busy ? "Planning your trip…" : "✨ Generate my plan"}
        </XButton>
      </form>

      {result && <ItineraryView itinerary={result} />}
    </div>
  );
}

function ItineraryView({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">🗺️ {itinerary.cityName}</h2>
          <p className="mt-1 text-sm text-neutral-500">{itinerary.summary}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            itinerary.source === "ai"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          }`}
          title={
            itinerary.source === "ai"
              ? "Generated by an AI model"
              : "Built from our curated place data"
          }
        >
          {itinerary.source === "ai" ? "✨ AI plan" : "📋 Curated plan"}
        </span>
      </div>

      {itinerary.days.map((day) => (
        <div key={day.day} className="card p-5">
          <div className="flex items-baseline gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">
              {day.day}
            </span>
            <h3 className="text-lg font-semibold">{day.theme || `Day ${day.day}`}</h3>
          </div>

          {day.activities.length > 0 && (
            <ul className="mt-4 space-y-3">
              {day.activities.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-20 shrink-0 pt-0.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    {a.time}
                  </span>
                  <div>
                    <p className="font-medium">
                      {a.placeId ? (
                        <Link href={`/place/${a.placeId}`} className="hover:text-rose-600 hover:underline">
                          {a.title}
                        </Link>
                      ) : (
                        a.title
                      )}
                    </p>
                    {a.detail && <p className="text-sm text-neutral-500">{a.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {day.meals.length > 0 && (
            <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <ul className="space-y-2">
                {day.meals.map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-20 shrink-0 capitalize text-neutral-400">
                      {MEAL_EMOJI[m.meal]} {m.meal}
                    </span>
                    <div>
                      <span className="font-medium">
                        {m.placeId ? (
                          <Link href={`/place/${m.placeId}`} className="hover:text-rose-600 hover:underline">
                            {m.title}
                          </Link>
                        ) : (
                          m.title
                        )}
                      </span>
                      {m.detail && <span className="text-neutral-500"> — {m.detail}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {itinerary.tips.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold">💡 Tips</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {itinerary.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
