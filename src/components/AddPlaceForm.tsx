"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLACE_CATEGORIES } from "@/lib/validations";
import { CATEGORY_LABELS } from "@/lib/i18n";

type City = { id: string; nameEn: string; name: string };

// Admin form to add a place. Lat/lng are Amap (高德) coordinates — look them up
// on amap.com. After saving you can open the place and add dishes / FF tags.
export function AddPlaceForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({
    nameEn: "",
    name: "",
    category: "FOOD",
    cityId: cities[0]?.id ?? "",
    lat: "",
    lng: "",
    priceLevel: 2,
    address: "",
    description: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) {
      const { id } = await res.json();
      setMsg("✓ Added. Opening…");
      router.push(`/place/${id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Failed");
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950";
  const lbl = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>English name</label>
          <input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} className={field} />
        </div>
        <div>
          <label className={lbl}>中文名</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
        </div>
        <div>
          <label className={lbl}>Category</label>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={field}>
            {PLACE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]?.emoji} {CATEGORY_LABELS[c]?.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>City</label>
          <select value={f.cityId} onChange={(e) => setF({ ...f, cityId: e.target.value })} className={field}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.nameEn} ({c.name})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Latitude (高德)</label>
          <input inputMode="decimal" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} placeholder="39.918" className={field} />
        </div>
        <div>
          <label className={lbl}>Longitude (高德)</label>
          <input inputMode="decimal" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} placeholder="116.397" className={field} />
        </div>
        <div>
          <label className={lbl}>Price level (1–4)</label>
          <input type="number" min={1} max={4} value={f.priceLevel} onChange={(e) => setF({ ...f, priceLevel: Number(e.target.value) })} className={field} />
        </div>
        <div>
          <label className={lbl}>Address (optional)</label>
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={field} />
        </div>
      </div>
      <div>
        <label className={lbl}>Description (optional)</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className={field} />
      </div>
      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <button type="submit" disabled={busy || !f.nameEn || !f.name || !f.lat || !f.lng} className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
        {busy ? "…" : "Add place"}
      </button>
    </form>
  );
}
