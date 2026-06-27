"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RatingInput } from "@/components/RatingStars";
import { useLang } from "@/components/LanguageProvider";

// Compact dish-level review form (rating + comment + must-try). Mirrors
// ReviewForm but posts to /api/dish-reviews and adds the must-try flag.
export function DishReviewForm({
  dishId,
  existing,
  onSaved,
}: {
  dishId: string;
  existing?: { rating: number; comment: string | null; mustTry: boolean } | null;
  onSaved?: () => void;
}) {
  const { status } = useSession();
  const { t } = useLang();
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [mustTry, setMustTry] = useState(existing?.mustTry ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border border-dashed border-black/10 p-3 text-center text-xs text-neutral-500 dark:border-white/15">
        <Link href="/auth/signin" className="font-medium text-rose-600 hover:underline">
          {t.loginToRateDish} →
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Pick a rating first.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/dish-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId, rating, comment, mustTry }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit");
      return;
    }
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
      <span className="mb-1 block text-xs text-neutral-500">{t.yourRating}</span>
      <RatingInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="What did you think?"
        className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-white/15 dark:bg-neutral-950"
      />
      <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={mustTry}
          onChange={(e) => setMustTry(e.target.checked)}
          className="h-4 w-4 accent-amber-500"
        />
        <span>⭐ {t.mustTry}</span>
      </label>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "…" : t.submit}
      </button>
    </form>
  );
}
