import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Which of the given posts the current user has liked — lets server components
// hand the initial liked state to <PostCard>. Empty for signed-out users.
// Mirrors getUserFavoriteSets in lib/favorites.ts.
export async function getUserPostLikes(postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Set();

  const likes = await prisma.postLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(likes.map((l) => l.postId));
}

// Which of the given posts the current user has collected (收藏). Empty for
// signed-out users. Mirrors getUserPostLikes.
export async function getUserPostSaves(postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Set();

  const saves = await prisma.postSave.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(saves.map((s) => s.postId));
}

