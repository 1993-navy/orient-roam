import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { tripSchema } from "@/lib/validations";

// GET /api/trips — the current user's trips (for the "add to trip" picker).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ trips: [] });
  const trips = await prisma.trip.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  return NextResponse.json({ trips });
}

// POST /api/trips — create a trip.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const parsed = tripSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { title, cityId } = parsed.data;
  const trip = await prisma.trip.create({
    data: { ownerId: session.user.id, title, cityId: cityId || null },
  });
  return NextResponse.json({ ok: true, id: trip.id });
}
