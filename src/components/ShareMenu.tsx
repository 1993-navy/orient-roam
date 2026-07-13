"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useLang } from "@/components/LanguageProvider";
import { INTERACTION_LABELS, SHARE_CHANNELS, biLabel } from "@/lib/i18n";

// Multi-channel share/repost (转发) menu. Opens a small popover (mirrors
// ReportButton's positioning) listing share channels:
//   Telegram / WhatsApp / X   -> open the platform's web share intent
//   WeChat / YouTube          -> no web share API, so copy the link instead
//   Copy link                 -> clipboard fallback
// Any share action bumps the server-side share count for the target.
export function ShareMenu({
  kind,
  targetId,
  title,
  path,
  initialCount = 0,
}: {
  kind: "post" | "place";
  targetId: string;
  /** Text used as the share caption (post/place name). */
  title?: string;
  /** Path to the shareable page, e.g. `/place/abc` or `/community?post=abc`. */
  path: string;
  initialCount?: number;
}) {
  const { locale } = useLang();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const text = title ?? "Orient Roam";

  const shareEndpoint = kind === "post" ? "/api/posts/share" : "/api/places/share";
  const idField = kind === "post" ? "postId" : "placeId";

  async function bumpCount() {
    setCount((c) => c + 1);
    try {
      const res = await fetch(shareEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idField]: targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.shareCount === "number") setCount(data.shareCount);
      }
    } catch {
      // Leave the optimistic bump; reconciles on next load.
    }
  }

  function openWindow(shareUrl: string) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    void bumpCount();
    setOpen(false);
  }

  async function copyLink(hint: boolean) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — still count the intent.
    }
    void bumpCount();
    if (!hint) setOpen(false);
  }

  const channels: { key: keyof typeof SHARE_CHANNELS; onClick: () => void }[] = [
    {
      key: "wechat",
      // WeChat has no web share intent — copy the link so it can be pasted in.
      onClick: () => void copyLink(true),
    },
    {
      key: "telegram",
      onClick: () =>
        openWindow(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        ),
    },
    {
      key: "whatsapp",
      onClick: () =>
        openWindow(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`),
    },
    {
      key: "youtube",
      // No share intent — copy the link.
      onClick: () => void copyLink(false),
    },
    {
      key: "x",
      onClick: () =>
        openWindow(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        ),
    },
  ];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={biLabel(INTERACTION_LABELS.share, locale)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-emerald-50 hover:text-emerald-600 dark:text-neutral-400 dark:hover:bg-emerald-950/40"
      >
        <Icon name="share" className="h-4 w-4" />
        <span className="tabular-nums">{copied ? "✓" : count}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-52 rounded-xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/15 dark:bg-neutral-900">
          <p className="px-2 pb-1 text-xs font-medium text-neutral-400">
            {biLabel(INTERACTION_LABELS.shareTo, locale)}
          </p>
          {channels.map(({ key, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span>{SHARE_CHANNELS[key].emoji}</span>
              <span>{biLabel(SHARE_CHANNELS[key], locale)}</span>
            </button>
          ))}
          <div className="my-1 border-t border-black/5 dark:border-white/10" />
          <button
            type="button"
            onClick={() => void copyLink(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <span>🔗</span>
            <span>
              {copied
                ? biLabel(INTERACTION_LABELS.linkCopied, locale)
                : biLabel(INTERACTION_LABELS.copyLink, locale)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
