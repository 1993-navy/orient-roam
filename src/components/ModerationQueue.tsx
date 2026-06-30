"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type QueueItem = {
  reportId: string;
  reporterName: string;
  reason: string;
  detail: string | null;
  createdAt: string;
  targetType: string; // MEETUP | USER | REVIEW | POST | PLACE | POOL | DISH_REVIEW
  targetId: string;
  // Resolved context about the reported entity (best-effort).
  contextTitle: string; // e.g. meetup title, user name, place name
  contextBody: string | null; // review/post text, etc.
  canHide: boolean; // HIDE_CONTENT applies (REVIEW/POST/MEETUP/POOL/DISH_REVIEW)
  canSuspend: boolean; // SUSPEND_USER applies (USER, or content author)
  suspendUserId: string | null;
};

export function ModerationQueue({ items }: { items: QueueItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(
    item: QueueItem,
    action: "DISMISS" | "HIDE_CONTENT" | "SUSPEND_USER",
  ) {
    setBusy(item.reportId);
    const body =
      action === "SUSPEND_USER"
        ? { reportId: item.reportId, action, targetType: "USER", targetId: item.suspendUserId }
        : { reportId: item.reportId, action, targetType: item.targetType, targetId: item.targetId };
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No open reports. 🎉</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.reportId} className="card p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
              {it.targetType}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              {it.reason}
            </span>
            <span className="text-neutral-400">
              by {it.reporterName} · {new Date(it.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-2 font-semibold">{it.contextTitle}</p>
          {it.contextBody && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              “{it.contextBody}”
            </p>
          )}
          {it.detail && (
            <p className="mt-1 text-xs text-neutral-400">Report note: {it.detail}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === it.reportId}
              onClick={() => act(it, "DISMISS")}
              className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-white/15 dark:hover:bg-neutral-800"
            >
              Dismiss
            </button>
            {it.canHide && (
              <button
                type="button"
                disabled={busy === it.reportId}
                onClick={() => act(it, "HIDE_CONTENT")}
                className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Remove content
              </button>
            )}
            {it.canSuspend && it.suspendUserId && (
              <button
                type="button"
                disabled={busy === it.reportId}
                onClick={() => act(it, "SUSPEND_USER")}
                className="rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
              >
                Suspend user
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
