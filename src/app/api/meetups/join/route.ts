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

  const userId = session.user.id;
  const meetup = await prisma.meetup.findUnique({
    where: { id: meetupId },
    select: { maxPeople: true, status: true },
  });
  if (!meetup) {
    return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
  }

  // Count only currently-joined participants (a left member frees a slot).
  const [joinedCount, mine] = await Promise.all([
    prisma.meetupParticipant.count({ where: { meetupId, status: "joined" } }),
    prisma.meetupParticipant.findUnique({
      where: { meetupId_userId: { meetupId, userId } },
    }),
  ]);
  if (mine?.status !== "joined" && joinedCount >= meetup.maxPeople) {
    return NextResponse.json({ error: "This meetup is full." }, { status: 409 });
  }

  await prisma.meetupParticipant.upsert({
    where: { meetupId_userId: { meetupId, userId } },
    create: { meetupId, userId },
    update: { status: "joined" },
  });

  // Auto-flag "full" once capacity is reached (only manage open↔full, never
  // override a host-set closed/cancelled).
  const newJoined = (mine?.status === "joined" ? joinedCount : joinedCount + 1);
  if (meetup.status === "open" && newJoined >= meetup.maxPeople) {
    await prisma.meetup.update({ where: { id: meetupId }, data: { status: "full" } });
  }

  return NextResponse.json({ ok: true });
}
