import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TripsView } from "@/components/TripsView";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-neutral-500">
          <Link href="/auth/signin" className="font-semibold text-rose-600 hover:underline">
            Sign in to plan trips →
          </Link>
        </p>
      </div>
    );
  }

  const [trips, cities] = await Promise.all([
    prisma.trip.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameEn: true } },
        _count: { select: { stops: true } },
      },
    }),
    prisma.city.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
  ]);

  return (
    <TripsView
      cities={cities}
      trips={trips.map((tr) => ({
        id: tr.id,
        title: tr.title,
        cityName: tr.city?.nameEn ?? null,
        stopCount: tr._count.stops,
      }))}
    />
  );
}
