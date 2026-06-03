/**
 * Minimal sanity checks for the recommendation weighting.
 * Run with: npx tsx scripts/check-recommendation.ts
 */
import assert from "node:assert";
import { computeWeightScore, GLOBAL_AVG } from "../src/lib/recommendation";

// 1. No reviews → falls back to the global prior.
assert.strictEqual(computeWeightScore(0, 0), GLOBAL_AVG, "no reviews → GLOBAL_AVG");

// 2. A single 5-star review is pulled toward the prior (not a full 5.0)...
const oneFiveStar = computeWeightScore(5, 1);
assert.ok(oneFiveStar < 5 && oneFiveStar > GLOBAL_AVG, "1×5★ between prior and 5");

// 3. ...and must NOT outrank a place with many strong reviews.
const manyGood = computeWeightScore(4.6, 60);
assert.ok(manyGood > oneFiveStar, "60×4.6★ outranks a lone 5★");

// 4. More positive reviews monotonically raise a high-rated place's score.
assert.ok(
  computeWeightScore(4.8, 50) > computeWeightScore(4.8, 5),
  "more reviews at the same high avg → higher score",
);

// 5. Score converges toward the true average as review count grows large.
assert.ok(
  Math.abs(computeWeightScore(4.2, 1000) - 4.2) < 0.05,
  "large N converges to avg",
);

console.log("✓ recommendation weighting checks passed");
