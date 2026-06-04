export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-4 h-8 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-6 h-[300px] rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>
    </div>
  );
}
