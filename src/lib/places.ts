import type { PlaceCardData } from "@/components/PlaceCard";

type PlaceRow = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string | null;
  priceLevel: number;
  avgRating: number;
  reviewCount: number;
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
    cityName: p.city?.nameEn,
    saved: fav?.saved.has(p.id) ?? false,
    wished: fav?.wished.has(p.id) ?? false,
    lng: p.lng,
    lat: p.lat,
  };
}
