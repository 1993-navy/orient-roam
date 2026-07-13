"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { FEEDBACK_CATEGORIES } from "@/lib/validations";

// Localized page header for the feedback page (client component so it can read
// the current locale from the language context).
export function FeedbackHeader() {
  const { t } = useLang();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t.feedbackTitle}</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {t.feedbackSubtitle}
      </p>
    </div>
  );
}


// Feedback (意见反馈) form. Works for signed-in and signed-out users; a contact
// email field is shown only when signed out so we can follow up. Posts to
// /api/feedback and shows a thank-you state on success.
export function FeedbackForm() {
  const { status } = useSession();
  const { t, locale } = useLang();

  const [category, setCategory] = useState<string>("OTHER");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
    BUG: { en: "Something's broken", zh: "功能异常 / Bug" },
    FEATURE: { en: "Feature idea", zh: "功能建议" },
    CONTENT: { en: "Content issue", zh: "内容问题" },
    OTHER: { en: "Other", zh: "其他" },
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length === 0) {
      setError(locale === "zh" ? "请写点什么吧" : "Please tell us a bit more.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit");
      }
      setDone(true);
      setMessage("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-3xl">🙏</p>
        <p className="mt-2 font-semibold">{t.feedbackThanks}</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-white/15 dark:hover:bg-neutral-800"
        >
          {t.feedbackAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <label className="block text-sm font-medium">{t.feedbackCategory}</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {FEEDBACK_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              category === c
                ? "bg-rose-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {locale === "zh" ? CATEGORY_LABELS[c].zh : CATEGORY_LABELS[c].en}
          </button>
        ))}
      </div>

      <label htmlFor="feedback-message" className="mt-4 block text-sm font-medium">
        {t.feedbackMessage}
      </label>
      <textarea
        id="feedback-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder={t.feedbackPlaceholder}
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-white/15 dark:bg-neutral-950"
      />

      {status !== "authenticated" && (
        <>
          <label htmlFor="feedback-email" className="mt-4 block text-sm font-medium">
            {t.feedbackEmail}
          </label>
          <input
            id="feedback-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-white/15 dark:bg-neutral-950"
          />
        </>
      )}

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "…" : t.feedbackSubmit}
      </button>
    </form>
  );
}
