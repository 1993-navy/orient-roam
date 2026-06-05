"use client";

import Link from "next/link";
import { RatingStars } from "@/components/RatingStars";
import { Icon } from "@/components/Icon";
import { HashtagText } from "@/lib/hashtags";
import { PostCard, type PostCardData } from "@/components/PostCard";
import { useLang } from "@/components/LanguageProvider";

type TopicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  placeId: string;
  placeName: string;
  placeNameEn: string;
};

export function TopicView({
  tag,
  posts,
  reviews,
}: {
  tag: string;
  posts: PostCardData[];
  reviews: TopicReview[];
}) {
  const { locale, t } = useLang();
  const total = posts.length + reviews.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
          <Icon name="hash" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {t.topic}
          </p>
          <h1 className="text-2xl font-extrabold">#{tag}</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        {total} {t.posts}
      </p>

      {total === 0 ? (
        <p className="mt-6 rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
          {t.noTopicPosts}
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {posts.length > 0 && (
            <section className="space-y-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </section>
          )}

          {reviews.length > 0 && (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/place/${r.placeId}`}
                      className="font-semibold hover:text-rose-600"
                    >
                      {locale === "zh" ? r.placeName : r.placeNameEn}
                    </Link>
                    <span className="text-xs text-neutral-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                    <RatingStars value={r.rating} className="text-sm" />
                    <Link href={`/profile/${r.userId}`} className="hover:text-rose-600">
                      {r.userName}
                    </Link>
                  </div>
                  {r.comment && (
                    <HashtagText
                      text={r.comment}
                      className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
