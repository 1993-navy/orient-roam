// Placeholder card shown by route loading.tsx files while the next page
// streams in — keeps navigation feeling instant instead of flashing blank.
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="mt-3 h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
