"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XButton } from "./XButton";
import { RatingStars } from "./RatingStars";

export function UserRatingForm({
  ratedId,
  ratedName,
  initialRating = 0,
  onComplete,
}: {
  ratedId: string;
  ratedName: string;
  initialRating?: number;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || busy) return;

    setBusy(true);
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratedId, rating, comment }),
    });
    setBusy(false);

    if (onComplete) {
      onComplete();
    } else {
      router.refresh();
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold">Rate {ratedName}</h3>
      <p className="mt-1 text-sm text-neutral-500">How would you rate your experience?</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex justify-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-transform hover:scale-125 ${
                  star <= rating ? "opacity-100" : "opacity-40"
                }`}
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill={star <= rating ? "#fbbf24" : "none"}
                  stroke={star <= rating ? "#fbbf24" : "#9ca3af"}
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {rating > 0 && (
          <div className="text-center">
            <span className="text-xl font-bold text-amber-500">{rating.toFixed(1)}</span>
            <span className="ml-1 text-sm text-neutral-500">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          </div>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)..."
          rows={3}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-rose-400 resize-none"
        />

        <div className="flex justify-end">
          <XButton
            variant="primary"
            size="md"
            type="submit"
            disabled={rating === 0 || busy}
          >
            {busy ? "..." : "Submit Rating"}
          </XButton>
        </div>
      </form>
    </div>
  );
}