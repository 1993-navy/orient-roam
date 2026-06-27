// Placeholder card shown by route loading.tsx files while the next page
// streams in — keeps navigation feeling instant instead of flashing blank.
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex gap-1.5">
        <div className="h-5 w-16 animate-shimmer rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-12 animate-shimmer rounded-full bg-neutral-200 dark:bg-neutral-800" style={{ animationDelay: '0.1s' }} />
      </div>
      <div className="mt-3 h-4 w-24 animate-shimmer rounded bg-neutral-200 dark:bg-neutral-800" style={{ animationDelay: '0.2s' }} />
      <div className="mt-2 h-5 w-3/4 animate-shimmer rounded bg-neutral-200 dark:bg-neutral-800" style={{ animationDelay: '0.3s' }} />
      <div className="mt-2 h-4 w-full animate-shimmer rounded bg-neutral-200 dark:bg-neutral-800" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
