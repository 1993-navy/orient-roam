"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ReviewedItem = {
  id: string;
  targetType: "PLACE" | "POST";
  kindLabel: string;
  title: string;
  status: "approved" | "rejected";
  note: string | null; // the feedback left on the last decision
  moderatorName: string;
  decidedAt: string;
};

// A "history / recycle bin" of recently reviewed submissions. Lets an admin
// change their mind: re-approve something they rejected (undo), or pull back
// something they approved. Both re-post to /api/admin/moderate, which is
// idempotent and re-logs the new decision.
export function ReviewedQueue({ items }: { items: ReviewedItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function redecide(
    item: ReviewedItem,
    action: "APPROVE_CONTENT" | "REJECT_CONTENT",
  ) {
    setBusy(item.id);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        targetType: item.targetType,
        targetId: item.id,
      }),
    });
    setBusy(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No reviewed submissions yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={`${it.targetType}-${it.id}`} className="card p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
              {it.kindLabel}
            </span>
            {it.status === "approved" ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                Approved
              </span>
            ) : (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                Rejected
              </span>
            )}
            <span className="text-neutral-400">
              {it.moderatorName} · {new Date(it.decidedAt).toLocaleString()}
            </span>
          </div>

          <p className="mt-2 font-semibold">{it.title}</p>
          {it.status === "rejected" && it.note && (
            <p className="mt-1 text-xs text-neutral-500">Feedback sent: {it.note}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {it.status === "rejected" ? (
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => redecide(it, "APPROVE_CONTENT")}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                ↩ Undo — approve instead
              </button>
            ) : (
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => redecide(it, "REJECT_CONTENT")}
                className="rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
              >
                ↩ Undo — reject instead
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
