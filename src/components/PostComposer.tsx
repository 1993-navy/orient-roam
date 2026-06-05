"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import type { PostCardData } from "@/components/PostCard";

// Compose a community post. On success it hands the freshly created post back to
// the parent feed (onPosted) so it appears at the top instantly — no reload.
export function PostComposer({
  cities,
  onPosted,
}: {
  cities: { id: string; nameEn: string }[];
  onPosted: (post: PostCardData) => void;
}) {
  const { t } = useLang();
  const { data: session } = useSession();
  const [body, setBody] = useState("");
  const [cityId, setCityId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, cityId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onPosted({
        id: data.id,
        body,
        createdAt: data.createdAt ?? new Date().toISOString(),
        authorId: session?.user?.id ?? "",
        authorName: session?.user?.name ?? "You",
        cityName: cities.find((c) => c.id === cityId)?.nameEn ?? null,
        likeCount: 0,
        liked: false,
      });
      setBody("");
      setCityId("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={t.postPlaceholder}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-neutral-400"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-neutral-950"
        >
          <option value="">{t.anyCity}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
        <button
          disabled={busy || !body.trim()}
          className="rounded-full bg-rose-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? "…" : t.shareUpdate}
        </button>
      </div>
    </form>
  );
}
