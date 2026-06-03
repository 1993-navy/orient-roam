import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CityView } from "@/components/CityView";

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      places: {
        orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
        include: { city: { select: { nameEn: true } } },
      },
    },
  });

  if (!city) notFound();

  return (
    <CityView
      city={{
        id: city.id,
        name: city.name,
        nameEn: city.nameEn,
        province: city.province,
        summary: city.summary,
        lng: city.lng,
        lat: city.lat,
      }}
      places={city.places.map((p) => ({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category,
        description: p.description,
        priceLevel: p.priceLevel,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
        cityName: p.city.nameEn,
        lng: p.lng,
        lat: p.lat,
      }))}
    />
  );
}
