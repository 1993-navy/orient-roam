"use client";

import { useState } from "react";
import { PostCard, type PostCardData } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { FeedFooter } from "@/components/FeedFooter";
import { useLang } from "@/components/LanguageProvider";

// The community信息流: composer (when signed in) + an infinite-scroll feed.
// Newly posted items are prepended locally (no reload) and de-duplicated against
// the paginated pages.
export function CommunityFeed({
  isAuthed,
  cities,
  initialPosts,
  initialHasMore,
}: {
  isAuthed: boolean;
  cities: { id: string; nameEn: string }[];
  initialPosts: PostCardData[];
  initialHasMore: boolean;
}) {
  const { t } = useLang();
  const [fresh, setFresh] = useState<PostCardData[]>([]);
  const { items, hasMore, loading, sentinelRef } = useInfiniteList<PostCardData>({
    endpoint: "/api/posts",
    query: "",
    pageSize: 15,
    initial: { items: initialPosts, hasMore: initialHasMore },
  });

  const freshIds = new Set(fresh.map((p) => p.id));
  const posts = [...fresh, ...items.filter((p) => !freshIds.has(p.id))];

  return (
    <section className="space-y-3">
      {isAuthed && (
        <PostComposer
          cities={cities}
          onPosted={(p) => setFresh((prev) => [p, ...prev])}
        />
      )}

      {posts.length === 0 && !loading ? (
        <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800">
          {t.postEmpty}
        </p>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}

      <FeedFooter
        sentinelRef={sentinelRef}
        loading={loading}
        hasMore={hasMore}
        count={posts.length}
      />
    </section>
  );
}
