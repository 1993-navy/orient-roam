import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { tripStopSchema } from "@/lib/validations";

async function ownerOfTrip(tripId: string): Promise<string | null> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { ownerId: true },
  });
  return trip?.ownerId ?? null;
}

async function ownerOfStop(stopId: string): Promise<string | null> {
  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { trip: { select: { ownerId: true } } },
  });
  return stop?.trip.ownerId ?? null;
}

// POST — add a place to a trip (idempotent per place).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const parsed = tripStopSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { tripId, placeId, day } = parsed.data;
  if ((await ownerOfTrip(tripId)) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.tripStop.upsert({
    where: { tripId_placeId: { tripId, placeId } },
    create: { tripId, placeId, day },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

// PATCH — move a stop to a different day.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const stopId: unknown = data?.stopId;
  const day = Number(data?.day);
  if (typeof stopId !== "string" || !Number.isFinite(day) || day < 1) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if ((await ownerOfStop(stopId)) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.tripStop.update({
    where: { id: stopId },
    data: { day: Math.min(30, Math.trunc(day)) },
  });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a stop from a trip.
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const stopId: unknown = data?.stopId;
  if (typeof stopId !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if ((await ownerOfStop(stopId)) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.tripStop.delete({ where: { id: stopId } });
  return NextResponse.json({ ok: true });
}
