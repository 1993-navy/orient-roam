"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { XButton } from "@/components/XButton";

type City = { id: string; name: string; nameEn: string };
type PlaceOption = { id: string; nameEn: string; name: string };

export function PoolForm({ cities }: { cities: City[] }) {
  const { t, locale } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceOption[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    cityId: "",
    placeId: "",
    productUrl: "",
    unitPriceYuan: "",
    targetPeople: 3,
    maxPeople: "",
    deadline: "",
  });

  const minDateTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  })();

  async function onCityChange(cityId: string) {
    setForm((f) => ({ ...f, cityId, placeId: "" }));
    setPlaces([]);
    if (!cityId) return;
    try {
      const res = await fetch(`/api/places?city=${cityId}&category=FOOD&take=50`);
      if (!res.ok) return;
      const data = await res.json();
      setPlaces((data.places ?? []).map((p: PlaceOption) => ({ id: p.id, nameEn: p.nameEn, name: p.name })));
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        unitPriceYuan: form.unitPriceYuan === "" ? undefined : Number(form.unitPriceYuan),
        maxPeople: form.maxPeople === "" ? undefined : Number(form.maxPeople),
      }),
    });
    setBusy(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/pool/${id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create pool");
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950";
  const lbl = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <>
      <XButton variant="primary" size="md" onClick={() => setOpen(true)}>
        + {t.createPool}
      </XButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t.createPool}</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">✕</button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className={lbl}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What are you pooling for?" className={field} />
              </div>

              <div>
                <label className={lbl}>City</label>
                <select value={form.cityId} onChange={(e) => onCityChange(e.target.value)} className={field}>
                  <option value="">Select a city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameEn} ({c.name})</option>
                  ))}
                </select>
              </div>

              {form.cityId && (
                <div>
                  <label className={lbl}>🍽️ {t.restaurant} / {t.placeOptional}</label>
                  <select value={form.placeId} onChange={(e) => setForm({ ...form, placeId: e.target.value })} className={field}>
                    <option value="">{t.noPlace}</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>{locale === "zh" ? p.name : p.nameEn}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>{t.targetPeople}</label>
                  <input type="number" min={2} max={100} value={form.targetPeople} onChange={(e) => setForm({ ...form, targetPeople: Number(e.target.value) })} className={field} />
                </div>
                <div>
                  <label className={lbl}>Cap (optional)</label>
                  <input type="number" min={2} max={100} value={form.maxPeople} onChange={(e) => setForm({ ...form, maxPeople: e.target.value })} className={field} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>¥ {t.perPerson} (optional)</label>
                  <input inputMode="decimal" value={form.unitPriceYuan} onChange={(e) => setForm({ ...form, unitPriceYuan: e.target.value })} className={field} />
                </div>
                <div>
                  <label className={lbl}>{t.deadline} (optional)</label>
                  <input type="datetime-local" min={minDateTime} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={field} />
                </div>
              </div>

              <div>
                <label className={lbl}>{t.productLink}</label>
                <input value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} placeholder="https://…" className={field} />
              </div>

              <div>
                <label className={lbl}>Description (optional)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${field} resize-none`} />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">Cancel</button>
                <XButton variant="primary" size="md" type="submit" disabled={busy || !form.title}>
                  {busy ? "..." : t.createPool}
                </XButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
