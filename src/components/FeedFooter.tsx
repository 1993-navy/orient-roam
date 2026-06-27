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
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="animate-fade-in">{t.loadingMore}</span>
        </div>
      ) : !hasMore && count > 0 ? (
        <span className="animate-fade-in">{t.endOfList}</span>
      ) : null}
    </div>
  );
}
