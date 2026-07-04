"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { biLabel, FOREIGNER_TAG_LABELS } from "@/lib/i18n";

import { Avatar } from "@/components/Avatar";
import { MessageButton } from "@/components/MessageButton";
import { ReportButton } from "@/components/ReportButton";
import { GroupChatButton } from "@/components/GroupChatButton";
import { priceYuan } from "@/components/PoolCard";

type Member = { id: string; name: string };

type PoolDetail = {
  id: string;
  title: string;
  description: string | null;
  cityName: string | null;
  placeId: string | null;
  placeName: string | null;
  placeForeignerTags?: string[];
  productUrl: string | null;
  organizerId: string;
  organizerName: string;
  unitPriceCents: number | null;
  targetPeople: number;
  maxPeople: number | null;
  deadline: string | null;
  status: string;
};

export function PoolDetailView({
  meId,
  isOrganizer,
  isJoined,
  members,
  pool,
}: {
  meId: string | null;
  isOrganizer: boolean;
  isJoined: boolean;
  members: Member[];
  pool: PoolDetail;
}) {
  const { t, locale } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const joined = members.length;
  const formed = pool.status === "formed" || joined >= pool.targetPeople;
  const pct = Math.min(100, Math.round((joined / pool.targetPeople) * 100));
  const full = Boolean(pool.maxPeople && joined >= pool.maxPeople);
  const price = priceYuan(pool.unitPriceCents);

  async function act(url: string) {
    setBusy(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/pools" className="text-sm text-neutral-500 hover:text-rose-600">
        ← {t.groupPools}
      </Link>

      <div className="mt-3 card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
          <span>🧧 {t.groupPools}</span>
          {pool.cityName && <span className="text-neutral-400">· {pool.cityName}</span>}
          {formed && <span className="text-emerald-600">· ✓ {t.formed}</span>}
        </div>
        <h1 className="mt-1 text-2xl font-bold">{pool.title}</h1>
        {pool.description && (
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">{pool.description}</p>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className={`h-full rounded-full ${formed ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              👥 {joined}/{pool.targetPeople}
            </span>
            {!formed && <span>{pool.targetPeople - joined} {t.needMore}</span>}
            {price && <span className="text-emerald-600">{price} {t.perPerson}</span>}
          </div>
        </div>

        <div className="mt-4 space-y-1 text-sm text-neutral-500">
          {pool.deadline && (
            <p>🕒 {t.deadline}: <span className="font-medium text-neutral-700 dark:text-neutral-300">{new Date(pool.deadline).toLocaleString()}</span></p>
          )}
          {pool.placeName && (
            <p>📍 {pool.placeId ? <Link href={`/place/${pool.placeId}`} className="hover:text-rose-600">{pool.placeName}</Link> : pool.placeName}</p>
          )}
          {pool.productUrl && (
            <p>🔗 <a href={pool.productUrl} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">{t.productLink}</a></p>
          )}
          <p>👤 <Link href={`/profile/${pool.organizerId}`} className="hover:text-rose-600">{pool.organizerName}</Link></p>
          {pool.placeForeignerTags && pool.placeForeignerTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {pool.placeForeignerTags.slice(0, 5).map((tag) => {
                const fl = FOREIGNER_TAG_LABELS[tag];
                if (!fl) return null;
                return (
                  <span key={tag} title={biLabel(fl, locale)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span aria-hidden="true">{fl.emoji}</span><span>{biLabel(fl, locale)}</span>

                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!meId && (
            <Link href="/auth/signin" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">{t.signIn}</Link>
          )}
          {meId && (isOrganizer || isJoined) && <GroupChatButton kind="pool" id={pool.id} />}
          {meId && isOrganizer && <span className="text-sm text-neutral-400">{t.hosting}</span>}
          {meId && !isOrganizer && !isJoined && (
            <button disabled={busy || full} onClick={() => act("/api/pools/join")} className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700">
              {full ? t.full : t.joinPool}
            </button>
          )}
          {meId && !isOrganizer && isJoined && (
            <button disabled={busy} onClick={() => act("/api/pools/leave")} className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-white/15 dark:hover:bg-neutral-800">
              {t.leave}
            </button>
          )}
          {meId && !isOrganizer && (
            <MessageButton targetUserId={pool.organizerId} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40" />
          )}
        </div>

        {meId && !isOrganizer && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/10">
            <ReportButton targetType="POOL" targetId={pool.id} label={t.reportPool} />
            <ReportButton targetType="USER" targetId={pool.organizerId} label={t.reportHost} />
          </div>
        )}
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold">{t.participants} · {joined}/{pool.targetPeople}</h2>
        <ul className="mt-3 space-y-2">
          {members.map((u) => (
            <li key={u.id} className="flex items-center gap-3 card p-3">
              <Avatar name={u.name} className="h-9 w-9 text-sm" />
              <Link href={`/profile/${u.id}`} className="font-medium hover:text-rose-600">{u.name}</Link>
              {u.id === pool.organizerId && <span className="text-xs font-semibold text-rose-600">organizer</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
