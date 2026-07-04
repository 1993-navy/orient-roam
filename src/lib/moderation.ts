// Lightweight proactive content filter applied at submission time.
//
// Two roles:
//   1. checkText()      — legacy spam/scam gate kept for the community feed.
//   2. screenContent()  — categorized screen for user-published content
//      (restaurants / attractions / travel diaries / photos / videos).
//      Flags 负面 (negative/abusive), 血腥暴力 (gore/violence),
//      政治敏感 (political), 煽动 (incitement) and 谣言 (rumor/misinformation).
//
// This is a conservative first line of defense — anything it flags is rejected
// up front, and everything else still goes to a human review queue before it
// goes live. The lists are intentionally small and meant to be extended (or
// swapped for a managed moderation service) later.

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build a matcher for a list of terms. Pure-ASCII words match on word
// boundaries (so "casino" won't hit inside "casinos"'s neighbours); anything
// with non-ASCII (e.g. Chinese) or spaces matches as a raw substring.
function buildMatcher(words: string[]): RegExp {
  return new RegExp(
    words
      .map((w) => {
        const e = escapeRegExp(w);
        return /^[\w']+$/.test(w) ? `\\b${e}\\b` : e;
      })
      .join("|"),
    "i",
  );
}

// ------------------------- Legacy spam / scam list -------------------------

const BANNED_WORDS = [
  "viagra",
  "casino",
  "crypto giveaway",
  "free money",
  "click here to win",
  "wire transfer fee",
  "telegram @",
];

const BANNED_RE = buildMatcher(BANNED_WORDS);

export type ModerationResult = { ok: true } | { ok: false; reason: string };

// Check one or more text fields against the spam/scam list. Returns ok:false on
// the first flagged field. Used by the quick community-post composer.
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

// ------------------------- Categorized content screen ----------------------

// Screening categories, matched in order. Keep the term lists conservative to
// avoid false positives; the human review queue is the real safety net.
export const MODERATION_CATEGORIES = [
  "SPAM",
  "NEGATIVE", // 负面/辱骂
  "GORE", // 血腥暴力
  "POLITICAL", // 政治敏感
  "INCITEMENT", // 煽动
  "RUMOR", // 谣言/虚假信息
] as const;

export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

// Bilingual keyword lists (en + zh). Lowercased matching (case-insensitive).
const CATEGORY_WORDS: Record<ModerationCategory, string[]> = {
  SPAM: BANNED_WORDS,
  NEGATIVE: [
    "fuck",
    "bastard",
    "idiot",
    "shut up",
    "go to hell",
    "傻逼",
    "滚蛋",
    "去死",
    "废物",
    "白痴",
    "垃圾东西",
  ],
  GORE: [
    "beheading",
    "dismember",
    "mutilate",
    "bloodbath",
    "gore",
    "torture to death",
    "斩首",
    "血腥",
    "残忍杀害",
    "肢解",
    "虐杀",
    "分尸",
  ],
  POLITICAL: [
    "overthrow the government",
    "topple the regime",
    "独立建国",
    "颠覆国家",
    "颠覆政府",
    "分裂国家",
    "反动政权",
    "打倒政府",
  ],
  INCITEMENT: [
    "incite violence",
    "take up arms",
    "storm the",
    "join the riot",
    "煽动",
    "聚众闹事",
    "暴力抗争",
    "号召起义",
    "组织暴动",
    "武装夺权",
  ],
  RUMOR: [
    "fake news",
    "unverified rumor",
    "谣言",
    "造谣",
    "散布谣言",
    "未经证实的消息",
    "虚假信息",
  ],
};

// Human-readable reason per category (English-first, mirrors app copy).
const CATEGORY_REASON: Record<ModerationCategory, string> = {
  SPAM: "This content looks like spam or a scam. Please revise it.",
  NEGATIVE: "This content contains abusive or offensive language. Please revise it.",
  GORE: "This content appears to contain graphic violence or gore and can't be published.",
  POLITICAL: "This content touches on sensitive political topics and can't be published.",
  INCITEMENT: "This content appears to incite unrest or violence and can't be published.",
  RUMOR: "This content may spread rumors or misinformation. Please revise it.",
};

const CATEGORY_MATCHERS: Record<ModerationCategory, RegExp> = Object.fromEntries(
  MODERATION_CATEGORIES.map((c) => [c, buildMatcher(CATEGORY_WORDS[c])]),
) as Record<ModerationCategory, RegExp>;

export type ScreenResult =
  | { ok: true }
  | { ok: false; category: ModerationCategory; reason: string };

// Screen one or more text fields across every category. Returns the first
// category that matches (checked in MODERATION_CATEGORIES order). Use this for
// user-published content (places / diaries / media captions).
export function screenContent(...texts: (string | null | undefined)[]): ScreenResult {
  const joined = texts.filter(Boolean).join("\n");
  if (!joined.trim()) return { ok: true };

  for (const category of MODERATION_CATEGORIES) {
    if (CATEGORY_MATCHERS[category].test(joined)) {
      return { ok: false, category, reason: CATEGORY_REASON[category] };
    }
  }
  return { ok: true };
}
