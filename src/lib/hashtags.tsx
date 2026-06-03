import Link from "next/link";

// #hashtags incl. CJK (Unicode letters/numbers/underscore).
// CHAR is the inner character class; we build the variants we need from it so
// extraction and rendering stay in sync.
const CHAR = "[\\p{L}\\p{N}_]+";

export function normalizeTag(raw: string): string {
  // Accepts a tag with or without a leading '#'.
  return raw.replace(/^#/, "").trim().toLowerCase().slice(0, 50);
}

// Extract the unique, normalized set of tags from a piece of text.
export function parseHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const m of text.matchAll(new RegExp(`#(${CHAR})`, "gu"))) {
    const tag = normalizeTag(m[1]);
    if (tag) out.add(tag);
  }
  return [...out];
}

// Render text with #hashtags turned into links to /topic/[tag]. No hooks, so it
// works in both server and client components.
export function HashtagText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Single capture group → split yields [text, "#tag", text, "#tag", ...].
  const parts = text.split(new RegExp(`(#${CHAR})`, "gu"));
  const isTag = new RegExp(`^#${CHAR}$`, "u");
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (isTag.test(part)) {
          const tag = normalizeTag(part);
          return (
            <Link
              key={i}
              href={`/topic/${encodeURIComponent(tag)}`}
              className="font-medium text-rose-600 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
