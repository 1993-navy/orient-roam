import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publishPlaceSchema } from "@/lib/validations";
import { screenContentAI } from "@/lib/moderation";


// POST /api/publish/place — a signed-in user submits a restaurant / attraction.
// It is created with moderationStatus = "pending" and stays out of public lists
// until an admin approves it. The submission text is first screened by the
// automatic content filter (spam / negative / gore / political / incitement /
// rumor); flagged submissions are rejected up front.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to publish." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = publishPlaceSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const screen = await screenContentAI(d.name, d.nameEn, d.address, d.description);

  if (!screen.ok) {
    return NextResponse.json(
      { error: screen.reason, category: screen.category },
      { status: 400 },
    );
  }

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
      moderationStatus: "pending",
      submittedById: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: place.id, status: "pending" });
}
