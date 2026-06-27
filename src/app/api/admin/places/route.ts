import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { placeCreateSchema } from "@/lib/validations";

// Admin-only: add a place (restaurant/attraction/etc.) to a city.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json().catch(() => null);
  const parsed = placeCreateSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const place = await prisma.place.create({
    data: {
      name: d.name,
      nameEn: d.nameEn,
      category: d.category,
      cityId: d.cityId,
      lat: d.lat,
      lng: d.lng,
      address: d.address || null,
      description: d.description || null,
      priceLevel: d.priceLevel,
    },
  });

  return NextResponse.json({ ok: true, id: place.id });
}
