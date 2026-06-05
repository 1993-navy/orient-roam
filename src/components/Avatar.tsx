// Shared initial-letter avatar (rounded square or circle). Used by the feed,
// chat, sidebar and profile so the gradient + initial logic lives in one place.
export function Avatar({
  name,
  className = "h-9 w-9 text-sm",
  square = false,
}: {
  name: string;
  className?: string;
  square?: boolean;
}) {
  return (
    <span
      className={`flex flex-none items-center justify-center bg-gradient-to-br from-rose-200 to-orange-200 font-bold text-neutral-700 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-200 ${square ? "rounded-lg" : "rounded-full"} ${className}`}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
