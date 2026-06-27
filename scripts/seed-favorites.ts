/**
 * Seed sample favorites (收藏/想去) so place cards show a save count and the
 * favorites/wishlist pages aren't empty. Idempotent: skips any place that
 * already has at least one "save" favorite.
 *
 *  - "save" count is loosely correlated with rating (better-rated places get
 *    more saves), then cached into Place.saveCount (mirrors the toggle API).
 *  - A few "wish" favorites are added too (no cached field, used by lists).
 *
 * Run:  npx tsx scripts/seed-favorites.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sample = <T>(arr: T[], n: number) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, Math.max(0, n));

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log("No users — run scripts/seed-reviews.ts first.");
    return;
  }
  const places = await prisma.place.findMany({
    select: { id: true, avgRating: true, saveCount: true },
  });

  let saveTotal = 0;
  let wishTotal = 0;
  let touched = 0;

  for (const place of places) {
    const existingSaves = await prisma.favorite.count({
      where: { placeId: place.id, kind: "save" },
    });
    if (existingSaves > 0) continue; // idempotent guard

    // 0..12 base, with a popularity bonus for highly-rated places.
    const base = Math.floor(Math.random() * 13);
    const bonus = place.avgRating >= 4.7 ? Math.floor(Math.random() * 6) : 0;
    const saveTarget = Math.min(users.length, base + bonus);
    const wishTarget = Math.min(users.length, Math.floor(Math.random() * 6));

    for (const u of sample(users, saveTarget)) {
      await prisma.favorite.create({
        data: { userId: u.id, placeId: place.id, kind: "save" },
      });
      saveTotal++;
    }
    for (const u of sample(users, wishTarget)) {
      // (userId, placeId, "wish") is a distinct key from "save" — safe overlap.
      await prisma.favorite.create({
        data: { userId: u.id, placeId: place.id, kind: "wish" },
      });
      wishTotal++;
    }

    await prisma.place.update({
      where: { id: place.id },
      data: { saveCount: saveTarget },
    });
    touched++;
  }

  console.log(
    `Done. ${touched} places seeded — ${saveTotal} saves, ${wishTotal} wishes.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
