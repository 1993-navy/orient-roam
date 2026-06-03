"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
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
    if (res.ok) router.push("/chat");
  }

  return (
    <button
      onClick={start}
      disabled={busy}
      className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
    >
      💬 Message
    </button>
  );
}
