import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/pools/leave { poolId } — leave a pool (organizer can't). Drops the
// pool back to "open" if it falls below the threshold.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const poolId: unknown = data?.poolId;
  if (typeof poolId !== "string") {
    return NextResponse.json({ error: "Invalid pool" }, { status: 400 });
  }
  const userId = session.user.id;

  const pool = await prisma.groupPool.findUnique({
    where: { id: poolId },
    select: { organizerId: true, targetPeople: true, status: true },
  });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  if (pool.organizerId === userId) {
    return NextResponse.json(
      { error: "The organizer can't leave their own pool." },
      { status: 400 },
    );
  }

  await prisma.poolMember.updateMany({
    where: { poolId, userId },
    data: { status: "left" },
  });

  if (pool.status === "formed") {
    const joinedCount = await prisma.poolMember.count({
      where: { poolId, status: "joined" },
    });
    if (joinedCount < pool.targetPeople) {
      await prisma.groupPool.update({ where: { id: poolId }, data: { status: "open" } });
    }
  }

  return NextResponse.json({ ok: true });
}
