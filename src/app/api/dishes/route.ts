import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dishSchema } from "@/lib/validations";

// Add a dish to a place. Records who created it (createdById) for later
// moderation. Returns the new dish so the client can append it optimistically.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = dishSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { placeId, name, nameEn, description, priceYuan } = parsed.data;

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (!place) {
    return NextResponse.json({ error: "Place not found." }, { status: 404 });
  }

  const dish = await prisma.dish.create({
    data: {
      placeId,
      name,
      nameEn,
      description: description || null,
      priceCents:
        priceYuan === undefined ? null : Math.round(priceYuan * 100),
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, dish });
}
