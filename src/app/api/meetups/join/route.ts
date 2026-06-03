import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/meetups/join  { meetupId }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const meetupId: unknown = data?.meetupId;
  if (typeof meetupId !== "string") {
    return NextResponse.json({ error: "Invalid meetup" }, { status: 400 });
  }

  const meetup = await prisma.meetup.findUnique({
    where: { id: meetupId },
    include: { _count: { select: { participants: true } } },
  });
  if (!meetup) {
    return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
  }
  if (meetup._count.participants >= meetup.maxPeople) {
    return NextResponse.json({ error: "This meetup is full." }, { status: 409 });
  }

  await prisma.meetupParticipant.upsert({
    where: { meetupId_userId: { meetupId, userId: session.user.id } },
    create: { meetupId, userId: session.user.id },
    update: { status: "joined" },
  });

  return NextResponse.json({ ok: true });
}
