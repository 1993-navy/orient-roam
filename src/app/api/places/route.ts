import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLACE_CATEGORIES } from "@/lib/validations";
import { getUserFavoriteSets } from "@/lib/favorites";

const DEFAULT_TAKE = 18;
const MAX_TAKE = 50;

// GET /api/places?city=&category=&q=&priceLevel=&minRating=&skip=&take=
// Returns places ranked by recommendation weight (best first), offset-paginated.
// Each place is annotated with the current user's saved/wished flags so cards
// appended via infinite scroll render identically to the SSR'd first page.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const priceLevel = Number(searchParams.get("priceLevel")) || undefined;
  const minRating = Number(searchParams.get("minRating")) || undefined;
  const skip = Math.max(0, Number(searchParams.get("skip")) || 0);
  const take = Math.min(
    MAX_TAKE,
    Math.max(1, Number(searchParams.get("take")) || DEFAULT_TAKE),
  );

  const where: Prisma.PlaceWhereInput = {
    ...(cityId ? { cityId } : {}),
    ...(category && PLACE_CATEGORIES.includes(category as never)
      ? { category }
      : {}),
    ...(priceLevel ? { priceLevel } : {}),
    ...(minRating ? { avgRating: { gte: minRating } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch one extra row to detect whether another page exists.
  const rows = await prisma.place.findMany({
    where,
    orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
    include: { city: { select: { nameEn: true, name: true } } },
    skip,
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  const { saved, wished } = await getUserFavoriteSets(page.map((p) => p.id));
  const places = page.map((p) => ({
    ...p,
    cityName: p.city.nameEn,
    saved: saved.has(p.id),
    wished: wished.has(p.id),
  }));

  return NextResponse.json({ places, hasMore });
}
