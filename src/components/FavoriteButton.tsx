"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { useLang } from "@/components/LanguageProvider";

export type FavoriteKind = "save" | "wish";

// Rounded X-style interaction pill. Optimistically toggles, then reconciles with
// the server's authoritative state. Signed-out users are sent to sign in.
export function FavoriteButton({
  placeId,
  kind,
  initialActive = false,
  showLabel = true,
}: {
  placeId: string;
  kind: FavoriteKind;
  initialActive?: boolean;
  showLabel?: boolean;
}) {
  const { status } = useSession();
  const { t } = useLang();
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);
  const [bump, setBump] = useState(false); // one-shot icon bounce on activate

  const label = kind === "wish" ? t.wantToGo : t.save;
  const activeClasses =
    kind === "wish"
      ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
      : "text-amber-600 bg-amber-50 dark:bg-amber-950/40";

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    const next = !active;
    setActive(next); // optimistic
    if (next) setBump(true); // bounce only when turning on (X heart pop)
    setPending(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, kind }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      if (typeof data.active === "boolean") setActive(data.active);
    } catch {
      setActive(!next); // revert on failure
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        active
          ? activeClasses
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      <span
        className={bump ? "inline-flex animate-pop" : "inline-flex"}
        onAnimationEnd={() => setBump(false)}
      >
        <Icon
          name={kind === "wish" ? "heart" : "bookmark"}
          className="h-4 w-4"
          filled={active}
          strokeWidth={active ? 2 : 1.8}
        />
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}
