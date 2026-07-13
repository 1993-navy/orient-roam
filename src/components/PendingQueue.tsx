"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PendingItem = {
  id: string;
  targetType: "PLACE" | "POST";
  kindLabel: string; // e.g. "Restaurant", "Travel diary"
  title: string;
  body: string | null;
  authorName: string;
  cityName: string | null;
  createdAt: string;
  mediaUrls: string[];
};

// Admin review queue for user-submitted content awaiting approval. Approve
// publishes it; reject opens a dialog to write feedback that is sent back to
// the author so they can revise. Both call /api/admin/moderate.
export function PendingQueue({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  // The item currently being rejected (shows the reason dialog), or null.
  const [rejecting, setRejecting] = useState<PendingItem | null>(null);
  const [reason, setReason] = useState("");

  async function approve(item: PendingItem) {
    setBusy(item.id);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE_CONTENT",
        targetType: item.targetType,
        targetId: item.id,
      }),
    });
    setBusy(null);
    router.refresh();
  }

  async function confirmReject() {
    if (!rejecting) return;
    setBusy(rejecting.id);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REJECT_CONTENT",
        targetType: rejecting.targetType,
        targetId: rejecting.id,
        note: reason.trim() || undefined,
      }),
    });
    setBusy(null);
    setRejecting(null);
    setReason("");
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No pending submissions. 🎉</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={`${it.targetType}-${it.id}`} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                {it.kindLabel}
              </span>
              <span className="text-neutral-400">
                by {it.authorName}
                {it.cityName ? ` · ${it.cityName}` : ""} ·{" "}
                {new Date(it.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 font-semibold">{it.title}</p>
            {it.body && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                {it.body}
              </p>
            )}

            {it.mediaUrls.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {it.mediaUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => approve(it)}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => {
                  setRejecting(it);
                  setReason("");
                }}
                className="rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
              >
                Reject…
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Reject-with-feedback dialog. The note is stored on the moderation
          action and shown to the author so they can revise and resubmit. */}
      {rejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setRejecting(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Reject submission</h3>
            <p className="mt-1 text-sm text-neutral-500">
              “{rejecting.title}” by {rejecting.authorName}
            </p>
            <label className="mt-4 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Feedback to the author (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              autoFocus
              placeholder="Explain what needs to change so they can revise and resubmit…"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy === rejecting.id}
                onClick={() => setRejecting(null)}
                className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-white/15 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === rejecting.id}
                onClick={confirmReject}
                className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {busy === rejecting.id ? "…" : "Reject & send feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
