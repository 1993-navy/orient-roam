// Shared rounded-pill style for filter chips/buttons (active = solid rose).
// Used by both the <Chip> (Link) and <FilterPill> (button) variants so the
// styling stays in one place.
export function pillClass(active: boolean): string {
  return `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "bg-rose-600 text-white"
      : "border border-black/10 bg-white hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900 dark:hover:bg-neutral-800"
  }`;
}
