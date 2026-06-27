"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { MEETUP_TYPE_LABELS } from "@/lib/i18n";
import { pillClass } from "@/lib/ui";

type City = { id: string; nameEn: string };

// Type + city + "my meetups" filters for /meetups. URL-driven (server re-renders
// the filtered list), mirroring the explore page's filter pattern.
export function MeetupFilters({
  cities,
  currentType,
  currentCity,
  mine,
  basePath = "/meetups",
  hideTypes = false,
}: {
  cities: City[];
  currentType?: string;
  currentCity?: string;
  mine: boolean;
  basePath?: string;
  hideTypes?: boolean;
}) {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useLang();

  function go(next: { type?: string; city?: string; mine?: boolean }) {
    const usp = new URLSearchParams();
    const type = next.type !== undefined ? next.type : currentType;
    const city = next.city !== undefined ? next.city : currentCity;
    const isMine = next.mine !== undefined ? next.mine : mine;
    if (type) usp.set("type", type);
    if (city) usp.set("city", city);
    if (isMine) usp.set("filter", "mine");
    const qs = usp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!hideTypes && (
          <button
            type="button"
            onClick={() => go({ type: "" })}
            className={pillClass(!currentType)}
          >
            {t.allTypes}
          </button>
        )}
        {!hideTypes &&
          Object.entries(MEETUP_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => go({ type })}
              className={pillClass(currentType === type)}
            >
              {label.emoji} {label.en}
            </button>
          ))}

        {status === "authenticated" && (
          <button
            type="button"
            onClick={() => go({ mine: !mine })}
            className={pillClass(mine)}
          >
            👤 {t.myMeetups}
          </button>
        )}
      </div>

      <select
        value={currentCity ?? ""}
        onChange={(e) => go({ city: e.target.value })}
        className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm outline-none focus:border-rose-400 dark:border-white/15 dark:bg-neutral-900"
      >
        <option value="">🌏 {t.anyCity}</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nameEn}
          </option>
        ))}
      </select>
    </div>
  );
}
