"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { biLabel, REPORT_REASON_LABELS } from "@/lib/i18n";

import { REPORT_REASONS } from "@/lib/validations";

// Lightweight report affordance. Opens a small reason picker, posts to
// /api/reports, and shows a thank-you. Reusable for any target type.
export function ReportButton({
  targetType,
  targetId,
  label,
}: {
  targetType: "MEETUP" | "USER" | "REVIEW" | "POST" | "PLACE" | "POOL" | "DISH_REVIEW";
  targetId: string;
  label: string;
}) {
  const { status } = useSession();
  const { t, locale } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, detail }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setOpen(false);
    }
  }

  if (done) {
    return <span className="text-xs text-neutral-400">{t.reportThanks}</span>;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-rose-600 dark:border-white/15"
      >
        ⚐ {label}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-lg dark:border-white/15 dark:bg-neutral-900">
          <label className="block text-xs font-medium text-neutral-500">
            {t.reportReason}
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {REPORT_REASON_LABELS[r] ? biLabel(REPORT_REASON_LABELS[r], locale) : r}

              </option>
            ))}
          </select>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            placeholder={t.reportDetail}
            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-950"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? "…" : t.report}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
