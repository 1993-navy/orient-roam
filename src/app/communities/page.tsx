import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunityCard } from "@/components/CommunityCard";
import { XButton } from "@/components/XButton";
import { T } from "@/components/T";
import { Suspense } from "react";

export default async function CommunitiesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [communities, cities] = await Promise.all([
    prisma.community.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameEn: true, name: true } },
        owner: { select: { name: true } },
        _count: { select: { members: true } },
        members: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    }),
    prisma.city.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <T k="community" />
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Join communities to meet fellow travelers and share experiences!
          </p>
        </div>
        {userId && (
          <XButton variant="primary" size="md">
            + Create Community
          </XButton>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">
          All
        </button>
        {cities.map((city) => (
          <button
            key={city.id}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-rose-400 hover:text-rose-600"
          >
            {city.nameEn}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            community={{
              id: community.id,
              name: community.name,
              description: community.description,
              cityName: community.city?.nameEn ?? community.city?.name ?? null,
              ownerName: community.owner.name,
              memberCount: community._count.members,
              joined: Array.isArray(community.members) ? community.members.length > 0 : false,
            }}
            isAuthed={Boolean(userId)}
          />
        ))}
      </div>

      {communities.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-neutral-400">No communities yet. Be the first to create one!</p>
          {userId && (
            <XButton variant="primary" size="md" className="mt-4">
              + Create Community
            </XButton>
          )}
        </div>
      )}
    </div>
  );
}