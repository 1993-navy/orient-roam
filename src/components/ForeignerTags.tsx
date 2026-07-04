"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { biLabel, FOREIGNER_TAG_LABELS } from "@/lib/i18n";

import { FOREIGNER_TAGS } from "@/lib/validations";

export type ForeignerTagState = { tag: string; count: number; mine: boolean };

// Foreigner-friendly attribute badges. Each chip is community-confirmed: a
// signed-in user toggles their own confirmation, with an optimistic ±1 count
// reconciled against the server's authoritative response.
export function ForeignerTags({
  placeId,
  initial,
}: {
  placeId: string;
  initial: ForeignerTagState[];
}) {
  const { status } = useSession();
  const { t, locale } = useLang();
  const router = useRouter();
  const [state, setState] = useState<Record<string, { count: number; mine: boolean }>>(
    () => Object.fromEntries(initial.map((s) => [s.tag, { count: s.count, mine: s.mine }])),
  );
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(tag: string) {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    const cur = state[tag] ?? { count: 0, mine: false };
    const next = !cur.mine;
    setState((prev) => ({
      ...prev,
      [tag]: { count: cur.count + (next ? 1 : -1), mine: next },
    }));
    setPending(tag);
    try {
      const res = await fetch("/api/places/foreigner-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, tag }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setState((prev) => ({ ...prev, [tag]: { count: data.count, mine: data.active } }));
    } catch {
      setState((prev) => ({ ...prev, [tag]: cur })); // revert
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-5">
      <h2 className="text-sm font-semibold text-neutral-500">{t.foreignerFriendly}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {FOREIGNER_TAGS.map((tag) => {
          const label = FOREIGNER_TAG_LABELS[tag];
          const st = state[tag] ?? { count: 0, mine: false };
          const confirmed = st.count > 0;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              disabled={pending === tag}
              aria-pressed={st.mine}
              title={status === "authenticated" ? t.confirmTag : t.loginToConfirm}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
                st.mine
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : confirmed
                    ? "border-black/10 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-200"
                    : "border-dashed border-black/15 text-neutral-400 hover:text-neutral-600 dark:border-white/15 dark:hover:text-neutral-300"
              }`}
            >
              <span>{label.emoji}</span>
              <span>{biLabel(label, locale)}</span>

              {st.count > 0 && (
                <span className="tabular-nums text-[10px] opacity-70">{st.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
