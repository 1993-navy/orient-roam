import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PlaceDetailView } from "@/components/PlaceDetailView";
import { FOREIGNER_TAGS } from "@/lib/validations";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      city: true,
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      dishes: {
        orderBy: [
          { mustTryCount: "desc" },
          { avgRating: "desc" },
          { reviewCount: "desc" },
        ],
        // Only the current user's own review per dish (none when signed out).
        include: { reviews: { where: { userId: userId ?? "__none__" }, take: 1 } },
      },
      foreignerTags: { select: { tag: true, userId: true } },
    },
  });

  if (!place) notFound();

  const myReview = userId
    ? place.reviews.find((r) => r.userId === userId)
    : undefined;

  // Collapse foreigner-tag votes into per-tag counts + whether I confirmed.
  const foreignerTags = FOREIGNER_TAGS.map((tag) => {
    const votes = place.foreignerTags.filter((ft) => ft.tag === tag);
    return {
      tag,
      count: votes.length,
      mine: userId ? votes.some((v) => v.userId === userId) : false,
    };
  });

  return (
    <PlaceDetailView
      place={{
        id: place.id,
        name: place.name,
        nameEn: place.nameEn,
        category: place.category,
        description: place.description,
        address: place.address,
        priceLevel: place.priceLevel,
        avgRating: place.avgRating,
        reviewCount: place.reviewCount,
        lng: place.lng,
        lat: place.lat,
        cityName: place.city.nameEn,
        cityId: place.cityId,
      }}
      reviews={place.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name,
        createdAt: r.createdAt.toISOString(),
      }))}
      myReview={myReview ? { rating: myReview.rating, comment: myReview.comment } : null}
      foreignerTags={foreignerTags}
      dishes={place.dishes.map((d) => {
        const mine = d.reviews[0];
        return {
          id: d.id,
          name: d.name,
          nameEn: d.nameEn,
          description: d.description,
          priceCents: d.priceCents,
          avgRating: d.avgRating,
          reviewCount: d.reviewCount,
          mustTryCount: d.mustTryCount,
          myReview: mine
            ? { rating: mine.rating, comment: mine.comment, mustTry: mine.mustTry }
            : null,
        };
      })}
    />
  );
}
