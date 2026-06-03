import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PlaceDetailView } from "@/components/PlaceDetailView";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      city: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!place) notFound();

  const myReview = session?.user?.id
    ? place.reviews.find((r) => r.userId === session.user.id)
    : undefined;

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
    />
  );
}
