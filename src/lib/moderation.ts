// Lightweight proactive content filter applied at submission time. A conservative
// banned-terms list (spam / scam markers) matched case-insensitively on word
// boundaries so we don't flag innocent substrings. The actual slur/explicit list
// is kept short here and meant to be extended (or swapped for a managed service).
const BANNED_WORDS = [
  "viagra",
  "casino",
  "crypto giveaway",
  "free money",
  "click here to win",
  "wire transfer fee",
  "telegram @",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BANNED_RE = new RegExp(
  BANNED_WORDS.map((w) => {
    const e = escapeRegExp(w);
    return /^\w+$/.test(w) ? `\\b${e}\\b` : e;
  }).join("|"),
  "i",
);

export type ModerationResult = { ok: true } | { ok: false; reason: string };

// Check one or more text fields. Returns ok:false on the first flagged field.
export function checkText(...texts: (string | null | undefined)[]): ModerationResult {
  for (const t of texts) {
    if (t && BANNED_RE.test(t)) {
      return {
        ok: false,
        reason: "Your text was flagged by our community filter. Please revise it.",
      };
    }
  }
  return { ok: true };
}
