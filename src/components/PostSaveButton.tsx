"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";

// Post collect (收藏) pill — optimistic toggle + live count, reconciled with the
// server's authoritative { saved, saveCount }. Mirrors LikeButton; signed-out
// users are routed to sign in.
export function PostSaveButton({
  postId,
  initialSaved = false,
  initialCount = 0,
}: {
  postId: string;
  initialSaved?: boolean;
  initialCount?: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [bump, setBump] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    const next = !saved;
    setSaved(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) setBump(true);
    setPending(true);
    try {
      const res = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      if (typeof data.saved === "boolean") setSaved(data.saved);
      if (typeof data.saveCount === "number") setCount(data.saveCount);
    } catch {
      setSaved(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        saved
          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      <span
        className={bump ? "inline-flex animate-pop" : "inline-flex"}
        onAnimationEnd={() => setBump(false)}
      >
        <Icon name="bookmark" className="h-4 w-4" filled={saved} strokeWidth={saved ? 2 : 1.8} />
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
