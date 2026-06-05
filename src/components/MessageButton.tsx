"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Starts (or reuses) a 1:1 conversation, then deep-links straight into that
// thread (/chat?c=<id>) so the user lands in the conversation they intended —
// not whatever happens to be first in the list.
export function MessageButton({
  targetUserId,
  className = "rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60",
}: {
  targetUserId: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      router.push(data?.id ? `/chat?c=${data.id}` : "/chat");
    }
  }

  return (
    <button onClick={start} disabled={busy} className={className}>
      💬 Message
    </button>
  );
}
