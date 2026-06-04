import { SkeletonCard } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-9 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-6 h-[360px] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
