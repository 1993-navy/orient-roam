"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { XButton } from "@/components/XButton";

type CommunityData = {
  id: string;
  name: string;
  description: string | null;
  cityName: string | null;
  ownerName: string;
  memberCount: number;
  joined: boolean;
};

export function CommunityCard({
  community,
  isAuthed,
}: {
  community: CommunityData;
  isAuthed: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    if (!isAuthed || community.joined || busy) return;
    setBusy(true);
    await fetch("/api/communities/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId: community.id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <article className="group card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar name={community.name} className="h-12 w-12 text-lg" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <Link
              href={`/community/${community.id}`}
              className="font-bold group-hover:text-rose-600 transition-colors duration-200"
            >
              {community.name}
            </Link>
            {community.cityName && (
              <span className="text-xs text-neutral-400">{community.cityName}</span>
            )}
          </div>
          {community.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
              {community.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
            <span>👤 {community.ownerName}</span>
            <span>👥 {community.memberCount} members</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/community/${community.id}`}
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 text-center transition-all duration-200 hover:border-rose-400 hover:text-rose-600"
        >
          View Details
        </Link>
        {isAuthed && (
          <XButton
            variant={community.joined ? "secondary" : "primary"}
            size="sm"
            disabled={busy}
            onClick={handleJoin}
          >
            {community.joined ? "✓ Joined" : busy ? "..." : "Join"}
          </XButton>
        )}
      </div>
    </article>
  );
}