"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

// Opens (creating on first use) the group chat for a meetup/pool, then deep-links
// into the thread. Shown only to participants.
export function GroupChatButton({
  kind,
  id,
}: {
  kind: "meetup" | "pool";
  id: string;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    const res = await fetch("/api/group-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      router.push(data?.id ? `/chat?c=${data.id}` : "/chat");
    }
  }

  return (
    <button
      onClick={open}
      disabled={busy}
      className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
    >
      💬 {t.groupChat}
    </button>
  );
}
