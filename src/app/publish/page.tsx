import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PublishView } from "@/components/PublishView";

// The "我要发布 / Publish" destination. Users pick a type (restaurant, attraction,
// travel diary, photos, video) and submit; everything is held for review.
export default async function PublishPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const cities = await prisma.city.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, name: true, nameEn: true },
  });

  return <PublishView cities={cities} />;
}
