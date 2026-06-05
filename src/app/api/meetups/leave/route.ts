import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/meetups/leave  { meetupId } — leave a meetup (the host can't leave
// their own). Marks the participant row as "left" so the slot frees up.
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
    select: { hostId: true },
  });
  if (!meetup) {
    return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
  }
  if (meetup.hostId === userId) {
    return NextResponse.json(
      { error: "The host can't leave their own meetup." },
      { status: 400 },
    );
  }

  await prisma.meetupParticipant.updateMany({
    where: { meetupId, userId },
    data: { status: "left" },
  });

  return NextResponse.json({ ok: true });
}
