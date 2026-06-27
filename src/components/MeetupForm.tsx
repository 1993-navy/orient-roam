"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { MEETUP_TYPE_LABELS } from "@/lib/i18n";
import { XButton } from "@/components/XButton";

type City = { id: string; name: string; nameEn: string };

type PlaceOption = { id: string; nameEn: string; name: string };

export function MeetupForm({ cities }: { cities: City[] }) {
  const { t, locale } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceOption[]>([]);

  const [form, setForm] = useState({
    type: "MEAL" as string,
    title: "",
    description: "",
    cityId: "",
    placeId: "",
    startTime: "",
    endTime: "",
    maxPeople: 4,
    recurrence: "none" as string,
    recurrenceDay: 1,
  });

  // datetime-local min = now, in the browser's local time.
  const minDateTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  })();

  // When the city changes, load that city's restaurants for the place picker.
  async function onCityChange(cityId: string) {
    setForm((f) => ({ ...f, cityId, placeId: "" }));
    setPlaces([]);
    if (!cityId) return;
    try {
      const res = await fetch(`/api/places?city=${cityId}&category=FOOD&take=50`);
      if (!res.ok) return;
      const data = await res.json();
      setPlaces(
        (data.places ?? []).map((p: PlaceOption) => ({
          id: p.id,
          nameEn: p.nameEn,
          name: p.name,
        })),
      );
    } catch {
      /* ignore — picker just stays empty */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.cityId || !form.startTime) return;

    setBusy(true);
    setError(null);
    const res = await fetch("/api/meetups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/meetup/${id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create meetup");
    }
  }

  return (
    <>
      <XButton variant="primary" size="md" onClick={() => setOpen(true)}>
        + Create Meetup
      </XButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Create a Meetup</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Type
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {Object.entries(MEETUP_TYPE_LABELS).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${
                        form.type === type
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {label.emoji} {label.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="What's your meetup about?"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  City
                </label>
                <select
                  value={form.cityId}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                >
                  <option value="">Select a city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Restaurant / place picker — the 约饭 hook. Populated per city. */}
              {form.cityId && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {form.type === "MEAL" ? `🍽️ ${t.restaurant}` : t.placeOptional}
                  </label>
                  <select
                    value={form.placeId}
                    onChange={(e) => setForm({ ...form, placeId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                  >
                    <option value="">{t.noPlace}</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {locale === "zh" ? p.name : p.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Date & Time
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    min={minDateTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                  />
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    min={form.startTime || minDateTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    placeholder="End time (optional)"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Max People
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={form.maxPeople}
                  onChange={(e) => setForm({ ...form, maxPeople: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Recurrence
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {["none", "weekly", "monthly"].map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setForm({ ...form, recurrence: rec })}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-medium capitalize transition-all ${
                        form.recurrence === rec
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
                {(form.recurrence === "weekly" || form.recurrence === "monthly") && (
                  <div className="mt-2">
                    <select
                      value={form.recurrenceDay}
                      onChange={(e) => setForm({ ...form, recurrenceDay: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700"
                    >
                      {form.recurrence === "weekly" ? (
                        [1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <option key={d} value={d}>
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d - 1]}
                          </option>
                        ))
                      ) : (
                        Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}th of month
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Tell others about your meetup..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 resize-none dark:border-neutral-700"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <XButton
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={busy || !form.title || !form.cityId || !form.startTime}
                >
                  {busy ? "..." : "Create"}
                </XButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}