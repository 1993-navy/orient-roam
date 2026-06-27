import type { PlaceCardData } from "@/components/PlaceCard";
import { prisma } from "@/lib/prisma";

type PlaceRow = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string | null;
  priceLevel: number;
  avgRating: number;
  reviewCount: number;
  saveCount?: number;
  lng: number;
  lat: number;
  city?: { nameEn: string } | null;
};

// Map a Prisma place row to the shape <PlaceCard> consumes, applying the
// current user's saved/wished flags. lng/lat are kept for map markers.
// Single source of truth — used by the explore/city/home pages and /api/places.
export function toPlaceCardData(
  p: PlaceRow,
  fav?: { saved: Set<string>; wished: Set<string> },
  foreignerTags?: string[],
): PlaceCardData & { lng: number; lat: number } {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category,
    description: p.description,
    priceLevel: p.priceLevel,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    saveCount: p.saveCount ?? 0,
    cityName: p.city?.nameEn,
    saved: fav?.saved.has(p.id) ?? false,
    wished: fav?.wished.has(p.id) ?? false,
    foreignerTags: foreignerTags ?? [],
    lng: p.lng,
    lat: p.lat,
  };
}

// For a set of places, return each place's confirmed foreigner-friendly tags,
// ordered by confirmation count (most-confirmed first). One grouped query —
// reused by the explore page (SSR) and /api/places so cards can show badges.
export async function getPlaceForeignerTagMap(
  placeIds: string[],
): Promise<Map<string, string[]>> {
  if (placeIds.length === 0) return new Map();

  const rows = await prisma.placeForeignerTag.groupBy({
    by: ["placeId", "tag"],
    where: { placeId: { in: placeIds } },
    _count: { tag: true },
  });

  const byPlace = new Map<string, { tag: string; count: number }[]>();
  for (const r of rows) {
    const arr = byPlace.get(r.placeId) ?? [];
    arr.push({ tag: r.tag, count: r._count.tag });
    byPlace.set(r.placeId, arr);
  }

  const result = new Map<string, string[]>();
  for (const [placeId, arr] of byPlace) {
    result.set(
      placeId,
      arr.sort((a, b) => b.count - a.count).map((x) => x.tag),
    );
  }
  return result;
}
