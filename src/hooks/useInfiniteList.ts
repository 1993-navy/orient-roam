"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ApiPage<T> = { places?: T[]; items?: T[]; hasMore?: boolean };

/**
 * Generic offset-paginated infinite list.
 *
 * Seed the first page from the server (`initial`) so SSR content shows
 * instantly; when `query` (the serialized filter params, e.g.
 * `"city=x&category=FOOD"`) changes, the list resets and refetches from the
 * start. Attach the returned `sentinelRef` to a node near the end of the list —
 * it auto-loads the next page as it scrolls into view.
 */
export function useInfiniteList<T>({
  endpoint,
  query,
  pageSize = 18,
  initial,
}: {
  endpoint: string;
  query: string;
  pageSize?: number;
  initial?: { items: T[]; hasMore: boolean };
}) {
  const [items, setItems] = useState<T[]>(initial?.items ?? []);
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? true);
  const [loading, setLoading] = useState(false);

  // Which query the current `items` belong to — lets us skip refetching on the
  // initial mount (already seeded by SSR) but refetch on real filter changes.
  const seededQuery = useRef(initial ? query : null);

  const url = useCallback(
    (skip: number) =>
      `${endpoint}?${query}${query ? "&" : ""}skip=${skip}&take=${pageSize}`,
    [endpoint, query, pageSize],
  );

  const parse = (d: ApiPage<T>): { rows: T[]; more: boolean } => ({
    rows: d.places ?? d.items ?? [],
    more: Boolean(d.hasMore),
  });

  // Reset + reload whenever the filter query changes (skip the seeded mount).
  useEffect(() => {
    if (seededQuery.current === query) return;
    seededQuery.current = query;
    let cancelled = false;
    setLoading(true);
    fetch(url(0))
      .then((r) => r.json())
      .then((d: ApiPage<T>) => {
        if (cancelled) return;
        const { rows, more } = parse(d);
        setItems(rows);
        setHasMore(more);
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, url]);

  // Latest state in a ref so the IntersectionObserver callback (created once)
  // always sees current values without re-subscribing.
  const stateRef = useRef({ items, hasMore, loading });
  stateRef.current = { items, hasMore, loading };

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.loading || !s.hasMore) return;
    setLoading(true);
    fetch(url(s.items.length))
      .then((r) => r.json())
      .then((d: ApiPage<T>) => {
        const { rows, more } = parse(d);
        setItems((prev) => [...prev, ...rows]);
        setHasMore(more);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoading(false));
  }, [url]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLElement | null) => {
    observerRef.current?.disconnect();
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "400px" },
    );
    observerRef.current.observe(el);
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { items, hasMore, loading, sentinelRef };
}
