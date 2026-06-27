import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/pools/join { poolId } — join a pool; forms it once the threshold is hit.
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
    select: { targetPeople: true, maxPeople: true, status: true },
  });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const [joinedCount, mine] = await Promise.all([
    prisma.poolMember.count({ where: { poolId, status: "joined" } }),
    prisma.poolMember.findUnique({ where: { poolId_userId: { poolId, userId } } }),
  ]);

  const alreadyIn = mine?.status === "joined";
  if (!alreadyIn && pool.maxPeople && joinedCount >= pool.maxPeople) {
    return NextResponse.json({ error: "This pool is full." }, { status: 409 });
  }

  await prisma.poolMember.upsert({
    where: { poolId_userId: { poolId, userId } },
    create: { poolId, userId },
    update: { status: "joined" },
  });

  // Form the pool once the headcount threshold is reached.
  const newJoined = alreadyIn ? joinedCount : joinedCount + 1;
  if (pool.status === "open" && newJoined >= pool.targetPeople) {
    await prisma.groupPool.update({ where: { id: poolId }, data: { status: "formed" } });
  }

  return NextResponse.json({ ok: true });
}
