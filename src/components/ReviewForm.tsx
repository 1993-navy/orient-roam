"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RatingInput } from "@/components/RatingStars";
import { useLang } from "@/components/LanguageProvider";

export function ReviewForm({
  placeId,
  existing,
}: {
  placeId: string;
  existing?: { rating: number; comment: string | null } | null;
}) {
  const { status } = useSession();
  const { t } = useLang();
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated") {
    return (
      <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-sm text-neutral-500 dark:border-white/15">
        <Link href="/auth/signin" className="font-medium text-rose-600 hover:underline">
          {t.loginToReview} →
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
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, rating, comment }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <h3 className="font-semibold">{existing ? "Update your review" : t.writeReview}</h3>
      <div className="mt-2">
        <span className="mb-1 block text-sm text-neutral-500">{t.yourRating}</span>
        <RatingInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share what you loved…"
        className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-white/15 dark:bg-neutral-950"
      />
      <p className="mt-1 text-xs text-neutral-400">{t.hashtagHint}</p>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "…" : t.submit}
      </button>
    </form>
  );
}
