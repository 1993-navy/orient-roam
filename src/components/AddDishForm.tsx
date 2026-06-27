"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

// Add a new dish to a place. Bilingual name + optional price; posts to
// /api/dishes then refreshes so the server re-fetches the dish list.
export function AddDishForm({ placeId, onDone }: { placeId: string; onDone?: () => void }) {
  const { t } = useLang();
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [name, setName] = useState("");
  const [priceYuan, setPriceYuan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId,
        nameEn,
        name,
        priceYuan: priceYuan === "" ? undefined : Number(priceYuan),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add");
      return;
    }
    setNameEn("");
    setName("");
    setPriceYuan("");
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-neutral-900">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder={t.dishNameEn}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.dishNameZh}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
        />
      </div>
      <input
        value={priceYuan}
        onChange={(e) => setPriceYuan(e.target.value)}
        inputMode="decimal"
        placeholder={t.priceOptional}
        className="mt-2 w-40 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
      />
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !nameEn.trim() || !name.trim()}
        className="mt-2 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "…" : t.addDish}
      </button>
    </form>
  );
}
