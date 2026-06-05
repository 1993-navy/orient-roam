"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

// On a place page: add this place to one of the user's trips, or spin up a new
// trip on the spot. Fetches trips lazily when the picker opens.
export function AddToTripButton({ placeId }: { placeId: string }) {
  const { status } = useSession();
  const { t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<{ id: string; title: string }[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    const next = !open;
    setOpen(next);
    if (next && trips === null) {
      const res = await fetch("/api/trips");
      const d = await res.json().catch(() => null);
      setTrips(d?.trips ?? []);
    }
  }

  async function addStop(tripId: string) {
    await fetch("/api/trips/stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, placeId }),
    });
  }

  async function addToExisting(tripId: string) {
    setBusy(true);
    await addStop(tripId);
    setBusy(false);
    setOpen(false);
    setDone(true);
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    const d = await res.json().catch(() => null);
    if (d?.id) await addStop(d.id);
    setBusy(false);
    setNewTitle("");
    setOpen(false);
    setDone(true);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
      >
        {done ? "✓ " : "🧭 "}
        {t.addToTrip}
      </button>
      {open && (
        <div className="card absolute z-20 mt-2 w-60 p-2 shadow-lg">
          {trips === null ? (
            <p className="px-2 py-2 text-sm text-neutral-400">…</p>
          ) : (
            <>
              {trips.map((tr) => (
                <button
                  key={tr.id}
                  disabled={busy}
                  onClick={() => addToExisting(tr.id)}
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {tr.title}
                </button>
              ))}
              <form
                onSubmit={createAndAdd}
                className="mt-1 flex gap-1 border-t border-black/5 pt-2 dark:border-white/10"
              >
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.newTrip}
                  className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm outline-none dark:border-white/15 dark:bg-neutral-950"
                />
                <button
                  disabled={busy || !newTitle.trim()}
                  className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  +
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
