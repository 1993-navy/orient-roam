"use client";

import { useLang } from "@/components/LanguageProvider";

// Shared infinite-scroll sentinel + status line for the place/city/feed lists.
// Attach the list's `sentinelRef` (from useInfiniteList); shows "loading more"
// or "you've reached the end".
export function FeedFooter({
  sentinelRef,
  loading,
  hasMore,
  count,
}: {
  sentinelRef: (el: HTMLElement | null) => void;
  loading: boolean;
  hasMore: boolean;
  count: number;
}) {
  const { t } = useLang();
  return (
    <div ref={sentinelRef} className="py-4 text-center text-sm text-neutral-400">
      {loading ? t.loadingMore : !hasMore && count > 0 ? t.endOfList : ""}
    </div>
  );
}
