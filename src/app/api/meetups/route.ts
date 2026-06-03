import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { meetupSchema } from "@/lib/validations";

// POST /api/meetups  — create a meetup (拼饭/拼单/搭子), host auto-joins.
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
  const { type, title, description, cityId, placeId, maxPeople } = parsed.data;

  const meetup = await prisma.meetup.create({
    data: {
      type,
      title,
      description: description || null,
      cityId: cityId || null,
      placeId: placeId || null,
      maxPeople,
      hostId: session.user.id,
      participants: { create: [{ userId: session.user.id }] },
    },
  });

  return NextResponse.json({ ok: true, id: meetup.id });
}
