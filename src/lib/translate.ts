// Lightweight on-demand text translation for chat messages.
// Original message bodies are always stored/displayed as-is; this only produces
// a secondary translation into the viewer's chosen locale.
//
// Provider: Google's public (keyless) translate endpoint. Runs server-side only
// (Netlify Functions, US region) so it stays reachable from inside China where
// the browser could not hit Google directly.

import type { Locale } from "@/lib/i18n";

// Our Locale codes → Google target codes (only zh needs a region qualifier).
const GOOGLE_CODE: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  fr: "fr",
  es: "es",
  ja: "ja",
  ar: "ar",
  pt: "pt",
};

// Normalize a provider-detected code (e.g. "zh-CN", "en-US") back to our Locale.
export function normalizeDetected(code: string): string {
  return code.split("-")[0].toLowerCase();
}

export type TranslateResult = { translated: string; detected: string };

// Small process-wide cache so repeated views of the same message don't re-hit
// the provider. Keyed by `${to}:${text}`; bounded to avoid unbounded growth.
const cache = new Map<string, TranslateResult>();
const CACHE_MAX = 2000;

function cacheGet(key: string) {
  return cache.get(key);
}
function cacheSet(key: string, val: TranslateResult) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, val);
}

// Translate `text` into `to`. Returns the translation plus the language the
// provider detected for the source. On any failure, falls back to echoing the
// original text with an "unknown" detection so callers degrade gracefully.
export async function translateText(
  text: string,
  to: Locale,
): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) return { translated: text, detected: "unknown" };

  const target = GOOGLE_CODE[to] ?? "en";
  const key = `${target}:${trimmed}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t" +
      `&sl=auto&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`translate ${res.status}`);

    // Response shape: [[["translated","source",...], ...], ..., "detectedLang", ...]
    const data = (await res.json()) as unknown[];
    const segments = (data[0] as unknown[]) ?? [];
    const translated = segments
      .map((s) => (Array.isArray(s) ? (s[0] as string) : ""))
      .join("");
    const detected =
      typeof data[2] === "string" ? normalizeDetected(data[2]) : "unknown";

    const result: TranslateResult = {
      translated: translated || trimmed,
      detected,
    };
    cacheSet(key, result);
    return result;
  } catch {
    return { translated: text, detected: "unknown" };
  }
}
