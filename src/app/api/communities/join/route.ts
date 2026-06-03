import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/communities/join  { communityId }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const communityId: unknown = data?.communityId;
  if (typeof communityId !== "string") {
    return NextResponse.json({ error: "Invalid community" }, { status: 400 });
  }

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId, userId: session.user.id } },
    create: { communityId, userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
