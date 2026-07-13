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

// --------------------------- AI content screen -----------------------------
//
// screenContentAI() layers an LLM classifier on top of the keyword screen for
// user-published content. It:
//   1. runs the deterministic keyword screen first (cheap, catches the obvious
//      cases and lets us short-circuit without an API round-trip);
//   2. if that passes and an AI provider is configured, asks the model to
//      classify the text into one of MODERATION_CATEGORIES (or "OK").
//
// It is designed to *fail open*: if the provider is unconfigured, disabled, or
// errors/times out, we fall back to the keyword result so publishing never
// breaks — everything still lands in the human review queue as "pending".
//
// Provider is any OpenAI-compatible Chat Completions endpoint (OpenAI,
// DeepSeek, Moonshot, etc.), configured via env vars (see .env.example).

// Whether AI screening is turned on. Requires an API key and MODERATION_AI
// left unset or set to a truthy value ("1" / "true" / "on").
function aiEnabled(): boolean {
  if (!process.env.MODERATION_AI_API_KEY) return false;
  const flag = (process.env.MODERATION_AI ?? "on").toLowerCase();
  return flag === "1" || flag === "true" || flag === "on" || flag === "yes";
}

const AI_TIMEOUT_MS = Number(process.env.MODERATION_AI_TIMEOUT_MS) || 8000;

// System prompt: instruct the model to act as a strict content classifier and
// reply with a single JSON object. Categories mirror MODERATION_CATEGORIES.
const AI_SYSTEM_PROMPT = `You are a strict content-moderation classifier for a travel community app (content is in Chinese and/or English).

Classify the user-provided text into exactly ONE of these labels:
- SPAM: advertising, scams, phishing, fraud, or unsolicited promotion.
- NEGATIVE: abusive, insulting, or offensive language / harassment.
- GORE: graphic violence, gore, or extreme cruelty.
- POLITICAL: politically sensitive content (subversion, separatism, attacks on the state).
- INCITEMENT: incitement to violence, riots, or unrest.
- RUMOR: rumors, misinformation, or unverified false claims.
- OK: none of the above; the text is safe to publish.

Only flag content you are confident violates a category. Normal travel reviews,
restaurant/attraction descriptions, and travel diaries are OK. When unsure, answer OK.

Respond with ONLY a compact JSON object, no markdown, in the form:
{"category":"OK"|"SPAM"|"NEGATIVE"|"GORE"|"POLITICAL"|"INCITEMENT"|"RUMOR","reason":"short explanation"}`;

type AiVerdict = { category: ModerationCategory | "OK"; reason?: string };

// Parse the model's reply into a verdict, tolerating markdown fences / extra
// prose around the JSON. Returns null if nothing usable was found.
function parseAiVerdict(content: string): AiVerdict | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const category = (raw as { category?: unknown }).category;
  if (typeof category !== "string") return null;
  const upper = category.toUpperCase();
  if (upper === "OK") return { category: "OK" };
  if ((MODERATION_CATEGORIES as readonly string[]).includes(upper)) {
    const reason = (raw as { reason?: unknown }).reason;
    return {
      category: upper as ModerationCategory,
      reason: typeof reason === "string" ? reason : undefined,
    };
  }
  return null;
}

// Call the configured OpenAI-compatible Chat Completions endpoint. Returns a
// verdict, or null on any error (so the caller can fall back to fail-open).
async function classifyWithAI(text: string): Promise<AiVerdict | null> {
  const apiKey = process.env.MODERATION_AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.MODERATION_AI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = process.env.MODERATION_AI_MODEL || "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 8000) },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[moderation] AI provider returned ${res.status}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseAiVerdict(content);
  } catch (err) {
    // Timeouts, network errors, malformed responses — fail open.
    console.error("[moderation] AI screen failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Async counterpart to screenContent(): keyword screen first, then AI. Falls
// back to the keyword result (fail-open) whenever AI is off or unavailable.
export async function screenContentAI(
  ...texts: (string | null | undefined)[]
): Promise<ScreenResult> {
  // Deterministic keyword pass first — cheap and catches obvious violations.
  const keyword = screenContent(...texts);
  if (!keyword.ok) return keyword;

  if (!aiEnabled()) return keyword;

  const joined = texts.filter(Boolean).join("\n");
  if (!joined.trim()) return keyword;

  const verdict = await classifyWithAI(joined);
  if (!verdict || verdict.category === "OK") {
    // No usable AI verdict (fail-open) or explicitly safe.
    return keyword;
  }

  return {
    ok: false,
    category: verdict.category,
    reason: verdict.reason?.trim() || CATEGORY_REASON[verdict.category],
  };
}


