import { prisma } from "@/lib/prisma";

// --- Recommendation weighting -------------------------------------------------
//
// A place's position in recommendations is driven by its reviews, but we must
// not let a single 5-star review outrank a place with dozens of good ones.
// We use a Bayesian-weighted rating (a.k.a. "true Bayesian estimate"):
//
//     weightScore = (avgRating * reviewCount + GLOBAL_AVG * C) / (reviewCount + C)
//
// New/low-review places are pulled toward GLOBAL_AVG; as reviewCount grows the
// score converges to the place's own average. Every positive review nudges the
// score (and thus the ranking) upward.

export const GLOBAL_AVG = 3.8; // prior mean rating across the site
export const PRIOR_WEIGHT = 10; // C: how many "prior" reviews of confidence

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

// Recompute and persist a place's cached rating aggregates. Call inside the same
// transaction as a review write so the cache never drifts from the reviews.
export async function recalcPlaceAggregates(
  placeId: string,
  tx: Pick<typeof prisma, "review" | "place"> = prisma,
): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { placeId },
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
