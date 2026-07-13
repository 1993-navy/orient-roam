"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { useLang } from "@/components/LanguageProvider";
import { INTERACTION_LABELS, biLabel } from "@/lib/i18n";

type Comment = {
  id: string;
  body: string;
  userId: string;
  userName: string;
  createdAt: string;
};

// Post comments — a comment pill that expands an inline list + composer. The
// list is fetched lazily on first open; new comments are appended locally after
// a successful POST. Signed-out users are routed to sign in.
export function PostComments({
  postId,
  initialCount = 0,
}: {
  postId: string;
  initialCount?: number;
}) {
  const { status } = useSession();
  const { locale } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      try {
        const res = await fetch(`/api/posts/comments?postId=${postId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.comments)) setComments(data.comments);
        }
      } catch {
        // Leave empty; user can retry by collapsing/expanding.
      } finally {
        setLoaded(true);
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to comment");
        return;
      }
      if (data.comment) setComments((prev) => [...prev, data.comment]);
      if (typeof data.commentCount === "number") setCount(data.commentCount);
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={biLabel(INTERACTION_LABELS.comment, locale)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-sky-50 hover:text-sky-600 dark:text-neutral-400 dark:hover:bg-sky-950/40"
      >
        <Icon name="chat" className="h-4 w-4" />
        <span className="tabular-nums">{count}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {loaded && comments.length === 0 && (
            <p className="text-xs text-neutral-400">
              {biLabel(INTERACTION_LABELS.noComments, locale)}
            </p>
          )}
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <Avatar name={c.userName} className="h-7 w-7 flex-none text-xs" square />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{c.userName}</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-neutral-700 dark:text-neutral-200">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="flex items-start gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={1}
              placeholder={biLabel(INTERACTION_LABELS.writeComment, locale)}
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
            />
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="flex-none rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? "…" : biLabel(INTERACTION_LABELS.postComment, locale)}
            </button>
          </form>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
