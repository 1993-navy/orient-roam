import { prisma } from "@/lib/prisma";
import type { Place, Prisma } from "@prisma/client";

export const GLOBAL_AVG = 3.8;
export const PRIOR_WEIGHT = 10;

export function computeWeightScore(
  avgRating: number,
  reviewCount: number,
  globalAvg: number = GLOBAL_AVG,
  priorWeight: number = PRIOR_WEIGHT,
): number {
  if (reviewCount <= 0) return globalAvg;
  return (
    (avgRating * reviewCount + globalAvg * priorWeight) /
    (reviewCount + priorWeight)
  );
}

export async function recalcPlaceAggregates(
  placeId: string,
  tx: Pick<typeof prisma, "review" | "place"> = prisma,
): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { placeId, hidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avgRating = agg._avg.rating ?? 0;
  const reviewCount = agg._count.rating ?? 0;
  const weightScore = computeWeightScore(avgRating, reviewCount);

  await tx.place.update({
    where: { id: placeId },
    data: {
      avgRating,
      reviewCount,
      weightScore,
    },
  });
}

// --------------------------- Interaction Tracking ------------------------

const INTERACTION_SCORES: Record<string, number> = {
  VIEW: 0.5,
  SAVE: 3.0,
  WISH: 2.0,
  REVIEW: 5.0,
  LIKE: 1.0,
  VISIT: 4.0,
};

export async function trackUserInteraction(
  userId: string,
  placeId: string,
  type: string,
): Promise<void> {
  const score = INTERACTION_SCORES[type] || 0.5;

  await prisma.$transaction([
    prisma.userPlaceInteraction.create({
      data: { userId, placeId, type },
    }),
    prisma.place.findUnique({
      where: { id: placeId },
      select: { category: true },
    }),
  ]).then(async ([, place]) => {
    if (place?.category) {
      await prisma.userPreference.upsert({
        where: { userId_category: { userId, category: place.category } },
        create: {
          userId,
          category: place.category,
          score,
        },
        update: {
          score: { increment: score },
          lastVisited: new Date(),
        },
      });
    }
  });
}

// --------------------------- Personalized Recommendations ------------------------

export interface RecommendationOptions {
  userId?: string;
  cityId?: string;
  category?: string;
  limit?: number;
  excludePlaceIds?: string[];
}

interface PlaceWithScore extends Place {
  _personalizedScore?: number;
}

export async function getPersonalizedRecommendations(
  options: RecommendationOptions,
): Promise<Place[]> {
  const { userId, cityId, category, limit = 20, excludePlaceIds = [] } = options;

  let where: Prisma.PlaceWhereInput = {
    // Only publicly-visible (approved) places surface in recommendations.
    moderationStatus: "approved",
    ...(cityId ? { cityId } : {}),
    ...(category ? { category } : {}),
    ...(excludePlaceIds.length > 0 ? { id: { notIn: excludePlaceIds } } : {}),
  };

  const places = await prisma.place.findMany({
    where,
    include: { city: { select: { nameEn: true, name: true } } },
  });

  if (!userId) {

    return places
      .sort((a, b) => b.weightScore - a.weightScore)
      .slice(0, limit);
  }

  const [preferences, interactions] = await Promise.all([
    prisma.userPreference.findMany({
      where: { userId },
      select: { category: true, score: true },
    }),
    prisma.userPlaceInteraction.findMany({
      where: { userId },
      select: { placeId: true, type: true, createdAt: true },
    }),
  ]);

  const preferenceMap = new Map(
    preferences.map((p) => [p.category, p.score]),
  );

  const interactionSet = new Set(interactions.map((i) => i.placeId));

  const maxPreferenceScore = Math.max(...preferences.map((p) => p.score), 1);

  const scoredPlaces = places.map((place) => {
    let score = place.weightScore;

    const categoryScore = preferenceMap.get(place.category) || 0;
    if (categoryScore > 0) {
      score *= (1 + categoryScore / maxPreferenceScore) * 0.5;
    }

    if (interactionSet.has(place.id)) {
      score *= 0.3;
    }

    const recencyBonus = Math.min(place.reviewCount / 50, 1);
    score += recencyBonus * 0.5;

    return { ...place, _personalizedScore: score };
  });

  return scoredPlaces
    .sort((a, b) => (b._personalizedScore || 0) - (a._personalizedScore || 0))
    .slice(0, limit);
}

// --------------------------- Trending Recommendations ------------------------

export async function getTrendingPlaces(
  options: {
    cityId?: string;
    category?: string;
    limit?: number;
  } = {},
): Promise<Place[]> {
  const { cityId, category, limit = 10 } = options;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentReviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      ...(cityId ? { place: { cityId } } : {}),
      ...(category ? { place: { category } } : {}),
    },
    include: { place: { select: { id: true, category: true } } },
  });

  const reviewCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  recentReviews.forEach((r) => {
    reviewCounts[r.placeId] = (reviewCounts[r.placeId] || 0) + 1;
    categoryCounts[r.place.category] = (categoryCounts[r.place.category] || 0) + 1;
  });

  let where: Prisma.PlaceWhereInput = {
    moderationStatus: "approved",
    ...(cityId ? { cityId } : {}),
    ...(category ? { category } : {}),
  };

  const places = await prisma.place.findMany({
    where,
    include: { city: { select: { nameEn: true, name: true } } },
  });

  const maxRecentReviews = Math.max(...Object.values(reviewCounts), 1);


  return places
    .map((place) => {
      const recentCount = reviewCounts[place.id] || 0;
      const trendingScore = (recentCount / maxRecentReviews) * 2;
      return {
        ...place,
        _personalizedScore: place.weightScore + trendingScore,
      };
    })
    .sort((a, b) => (b._personalizedScore || 0) - (a._personalizedScore || 0))
    .slice(0, limit);
}

// --------------------------- Hybrid Recommendations ------------------------

export async function getHybridRecommendations(
  options: RecommendationOptions,
): Promise<Place[]> {
  const { userId, cityId, category, limit = 20 } = options;

  const [personalized, trending] = await Promise.all([
    getPersonalizedRecommendations({
      userId,
      cityId,
      category,
      limit: Math.floor(limit * 0.6),
    }),
    getTrendingPlaces({
      cityId,
      category,
      limit: Math.floor(limit * 0.4),
    }),
  ]);

  const seen = new Set<string>();
  const result: Place[] = [];

  const interleave = (list1: Place[], list2: Place[]) => {
    let i = 0,
      j = 0;
    while (i < list1.length || j < list2.length) {
      if (i < list1.length && !seen.has(list1[i].id)) {
        result.push(list1[i]);
        seen.add(list1[i].id);
        i++;
      }
      if (j < list2.length && !seen.has(list2[j].id)) {
        result.push(list2[j]);
        seen.add(list2[j].id);
        j++;
      }
      if (i < list1.length && seen.has(list1[i].id)) i++;
      if (j < list2.length && seen.has(list2[j].id)) j++;
    }
  };

  interleave(personalized, trending);

  return result.slice(0, limit);
}