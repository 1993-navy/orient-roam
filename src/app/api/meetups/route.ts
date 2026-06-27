import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { meetupSchema } from "@/lib/validations";
import { createCachedResponse } from "@/lib/cache";
import { checkText } from "@/lib/moderation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const parsed = meetupSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const {
    type,
    title,
    description,
    cityId,
    placeId,
    startTime,
    endTime,
    maxPeople,
    recurrence,
    recurrenceDay,
  } = parsed.data;

  const flag = checkText(title, description);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });

  const meetup = await prisma.meetup.create({
    data: {
      type,
      title,
      description: description || null,
      cityId: cityId || null,
      placeId: placeId || null,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      maxPeople,
      recurrence,
      recurrenceDay: recurrenceDay || null,
      hostId: session.user.id,
      participants: { create: [{ userId: session.user.id }] },
    },
  });

  return NextResponse.json({ ok: true, id: meetup.id });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const cityId = searchParams.get("city");
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = Math.min(50, Number(searchParams.get("limit")) || 20);

  const where: Record<string, unknown> = {
    status: "open",
    ...(type ? { type } : {}),
    ...(cityId ? { cityId } : {}),
  };

  if (upcoming) {
    where.startTime = { gte: new Date() };
  }

  const meetups = await prisma.meetup.findMany({
    where,
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      city: { select: { nameEn: true, name: true } },
      place: { select: { nameEn: true } },
      host: { select: { id: true, name: true } },
      participants: { where: { status: "joined" } },
    },
    take: limit,
  });

  const result = meetups.map((m) => ({
    id: m.id,
    type: m.type,
    title: m.title,
    description: m.description,
    cityName: m.city?.nameEn ?? null,
    cityNameZh: m.city?.name ?? null,
    placeName: m.place?.nameEn ?? null,
    hostId: m.host.id,
    hostName: m.host.name,
    startTime: m.startTime?.toISOString() ?? null,
    endTime: m.endTime?.toISOString() ?? null,
    maxPeople: m.maxPeople,
    currentPeople: m.participants.length,
    recurrence: m.recurrence,
    recurrenceDay: m.recurrenceDay,
    status: m.status,
  }));

  return createCachedResponse(result, {
    maxAge: 60,
    staleWhileRevalidate: 300,
  });
}
