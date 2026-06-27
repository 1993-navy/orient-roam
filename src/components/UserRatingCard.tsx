"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { RatingStars } from "./RatingStars";

type UserRating = {
  id: string;
  raterId: string;
  raterName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export function UserRatingCard({ rating }: { rating: UserRating }) {
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleDateString();
  }

  return (
    <article className="card p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${rating.raterId}`}>
          <Avatar name={rating.raterName} className="h-10 w-10 text-sm" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${rating.raterId}`}
              className="font-semibold hover:text-rose-600"
            >
              {rating.raterName}
            </Link>
            <span className="text-xs text-neutral-400">{fmtTime(rating.createdAt)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <RatingStars value={rating.rating} className="text-sm" />
            <span className="text-sm font-semibold text-amber-500">{rating.rating}.0</span>
          </div>
          {rating.comment && (
            <p className="mt-2 text-sm text-neutral-600">{rating.comment}</p>
          )}
        </div>
      </div>
    </article>
  );
}