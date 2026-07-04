import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PLACE_CATEGORIES, FOREIGNER_TAGS } from "@/lib/validations";
import { getUserFavoriteSets } from "@/lib/favorites";
import { toPlaceCardData, getPlaceForeignerTagMap } from "@/lib/places";
import { getHybridRecommendations } from "@/lib/recommendation";

const DEFAULT_TAKE = 18;
const MAX_TAKE = 50;

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const priceLevel = Number(searchParams.get("priceLevel")) || undefined;
  const minRating = Number(searchParams.get("minRating")) || undefined;
  // Foreigner-friendly tags: CSV of FOREIGNER_TAGS keys; AND semantics (a place
  // must have at least one confirmation vote for each selected tag).
  const ftags = (searchParams.get("foreignerTags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => FOREIGNER_TAGS.includes(s as never));
  const skip = Math.max(0, Number(searchParams.get("skip")) || 0);
  const take = Math.min(
    MAX_TAKE,
    Math.max(1, Number(searchParams.get("take")) || DEFAULT_TAKE),
  );

  let rows;

  if (!q && !priceLevel && !minRating && ftags.length === 0) {
    rows = await getHybridRecommendations({
      userId,
      cityId,
      category,
      limit: take + 1,
    });
  } else {
    const where: Prisma.PlaceWhereInput = {
      moderationStatus: "approved",
      ...(cityId ? { cityId } : {}),

      ...(category && PLACE_CATEGORIES.includes(category as never)
        ? { category }
        : {}),
      ...(priceLevel ? { priceLevel } : {}),
      ...(minRating ? { avgRating: { gte: minRating } } : {}),
      // Each selected tag must have at least one confirmation for the place.
      ...(ftags.length > 0
        ? { AND: ftags.map((tag) => ({ foreignerTags: { some: { tag } } })) }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { nameEn: { contains: q } },
            ],
          }
        : {}),
    };

    rows = await prisma.place.findMany({
      where,
      orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
      include: { city: { select: { nameEn: true, name: true } } },
      skip,
      take: take + 1,
    });
  }

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  const [fav, tagMap] = await Promise.all([
    getUserFavoriteSets(page.map((p) => p.id)),
    getPlaceForeignerTagMap(page.map((p) => p.id)),
  ]);
  const places = page.map((p) => toPlaceCardData(p, fav, tagMap.get(p.id)));

  return NextResponse.json({ places, hasMore });
}
