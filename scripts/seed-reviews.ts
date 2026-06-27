/**
 * Seed sample reviews for places that have none, so freshly-added restaurants
 * and attractions get a weightScore > 0 and can surface in recommendations /
 * trending. Idempotent: only touches places with reviewCount === 0.
 *
 *  - Ensures a pool of demo reviewer users exists (reviewerNN@orientroam.com).
 *  - For each 0-review place, adds 4–10 reviews skewed positive (mostly 4–5),
 *    then recomputes avgRating / reviewCount / weightScore.
 *
 * Run:  npx tsx scripts/seed-reviews.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mirror src/lib/recommendation.ts (kept inline to avoid the "@/..." path alias).
const GLOBAL_AVG = 3.8;
const PRIOR_WEIGHT = 10;
const computeWeightScore = (avg: number, n: number) =>
  n <= 0 ? GLOBAL_AVG : (avg * n + GLOBAL_AVG * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);

const REVIEWER_POOL = 16;
const COMMENTS = [
  "Loved it!", "Worth a visit.", "Great experience.", "Highly recommend.",
  "Absolutely delicious.", "A must-see.", "Better than expected.",
  "Will come back.", "Authentic and tasty.", "Beautiful spot.",
  "Friendly service.", "One of the highlights of my trip.",
];
// Positive-skewed rating bag (avg ~4.4).
const RATING_BAG = [5, 5, 5, 4, 4, 4, 5, 4, 3, 5];

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function ensureReviewers() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = [];
  for (let i = 1; i <= REVIEWER_POOL; i++) {
    const email = `reviewer${String(i).padStart(2, "0")}@orientroam.com`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name: `Traveler ${i}`, passwordHash, homeCountry: "United States", languages: "en" },
      update: {},
    });
    users.push(user);
  }
  return users;
}

async function main() {
  const reviewers = await ensureReviewers();
  const places = await prisma.place.findMany({ where: { reviewCount: 0 }, select: { id: true } });
  console.log(`Seeding reviews for ${places.length} places using ${reviewers.length} reviewers...`);

  let reviewTotal = 0;
  for (const place of places) {
    const n = 4 + Math.floor(Math.random() * 7); // 4..10
    const chosen = [...reviewers].sort(() => Math.random() - 0.5).slice(0, n);
    let sum = 0;
    for (const reviewer of chosen) {
      const rating = pick(RATING_BAG);
      sum += rating;
      await prisma.review.create({
        data: { userId: reviewer.id, placeId: place.id, rating, comment: pick(COMMENTS) },
      });
      reviewTotal++;
    }
    const avg = sum / chosen.length;
    await prisma.place.update({
      where: { id: place.id },
      data: { avgRating: avg, reviewCount: chosen.length, weightScore: computeWeightScore(avg, chosen.length) },
    });
  }

  console.log(`Done. created ${reviewTotal} reviews across ${places.length} places.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
