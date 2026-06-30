import { prisma } from "@/lib/prisma";

// Recompute a dish's cached aggregates from its reviews. Mirrors
// recalcPlaceAggregates (src/lib/recommendation.ts) — call it inside the same
// transaction as a DishReview write so the cached numbers can never drift.
export async function recalcDishAggregates(
  dishId: string,
  tx: Pick<typeof prisma, "dishReview" | "dish"> = prisma,
): Promise<void> {
  const [agg, mustTryCount] = await Promise.all([
    tx.dishReview.aggregate({
      where: { dishId, hidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    tx.dishReview.count({ where: { dishId, mustTry: true, hidden: false } }),
  ]);

  await tx.dish.update({
    where: { id: dishId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating ?? 0,
      mustTryCount,
    },
  });
}
