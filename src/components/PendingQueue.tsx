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
// publishes it; reject hides it. Both call /api/admin/moderate.
export function PendingQueue({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(item: PendingItem, action: "APPROVE_CONTENT" | "REJECT_CONTENT") {
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
    return <p className="text-sm text-neutral-500">No pending submissions. 🎉</p>;
  }

  return (
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
              onClick={() => act(it, "APPROVE_CONTENT")}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy === it.id}
              onClick={() => act(it, "REJECT_CONTENT")}
              className="rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
