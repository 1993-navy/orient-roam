"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

// Post share/repost (转发) pill. Copies the post's link to the clipboard (or uses
// the native share sheet when available) and bumps the server-side share count.
// No auth required — anyone can share.
export function PostShareButton({
  postId,
  initialCount = 0,
}: {
  postId: string;
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/community?post=${postId}`
        : "";

    // Prefer the native share sheet on mobile; fall back to clipboard copy.
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // User cancelled the share sheet — don't count it.
      return;
    }

    // Optimistically bump, then reconcile with the server's authoritative count.
    setCount((c) => c + 1);
    setPending(true);
    try {
      const res = await fetch("/api/posts/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.shareCount === "number") setCount(data.shareCount);
      }
    } catch {
      // Leave the optimistic bump; the count reconciles on next load.
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={copied ? "Link copied" : "Share"}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-60 dark:text-neutral-400 dark:hover:bg-emerald-950/40"
    >
      <Icon name="share" className="h-4 w-4" />
      <span className="tabular-nums">{copied ? "✓" : count}</span>
    </button>
  );
}
