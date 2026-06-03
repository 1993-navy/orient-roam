import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Resolve which of the given places the current user has marked as saved (收藏)
// and/or wished (想去), so server components can hand the initial toggle state
// to <PlaceCard>. Returns empty sets for signed-out users.
export async function getUserFavoriteSets(placeIds: string[]) {
  const empty = { saved: new Set<string>(), wished: new Set<string>() };
  if (placeIds.length === 0) return empty;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return empty;

  const favs = await prisma.favorite.findMany({
    where: { userId, placeId: { in: placeIds } },
    select: { placeId: true, kind: true },
  });

  const saved = new Set<string>();
  const wished = new Set<string>();
  for (const f of favs) {
    if (f.kind === "wish") wished.add(f.placeId);
    else saved.add(f.placeId);
  }
  return { saved, wished };
}
