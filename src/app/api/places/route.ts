import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLACE_CATEGORIES } from "@/lib/validations";

// GET /api/places?city=<id>&category=<CATEGORY>
// Returns places ranked by recommendation weight (best first).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const places = await prisma.place.findMany({
    where: {
      ...(cityId ? { cityId } : {}),
      ...(category && PLACE_CATEGORIES.includes(category as never)
        ? { category }
        : {}),
    },
    orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
    include: { city: { select: { nameEn: true, name: true } } },
  });

  return NextResponse.json({ places });
}
