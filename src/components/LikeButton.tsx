"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";

// Post like pill — optimistic toggle + live count, reconciled with the server's
// authoritative { liked, likeCount }. Mirrors FavoriteButton; the heart pops on
// activate (X-style). Signed-out users are routed to sign in.
export function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
}: {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [bump, setBump] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) setBump(true);
    setPending(true);
    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      if (typeof data.liked === "boolean") setLiked(data.liked);
      if (typeof data.likeCount === "number") setCount(data.likeCount);
    } catch {
      setLiked(!next);
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
      aria-pressed={liked}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        liked
          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      <span
        className={bump ? "inline-flex animate-pop" : "inline-flex"}
        onAnimationEnd={() => setBump(false)}
      >
        <Icon name="heart" className="h-4 w-4" filled={liked} strokeWidth={liked ? 2 : 1.8} />
      </span>
      <span>{count}</span>
    </button>
  );
}
