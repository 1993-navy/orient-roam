import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { poolSchema } from "@/lib/validations";
import { checkText } from "@/lib/moderation";

// Create a group pool. The organizer auto-joins as the first member.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = poolSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const flag = checkText(d.title, d.description);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });

  const pool = await prisma.groupPool.create({
    data: {
      organizerId: session.user.id,
      title: d.title,
      description: d.description || null,
      cityId: d.cityId || null,
      placeId: d.placeId || null,
      productUrl: d.productUrl || null,
      unitPriceCents:
        d.unitPriceYuan === undefined ? null : Math.round(d.unitPriceYuan * 100),
      targetPeople: d.targetPeople,
      maxPeople: d.maxPeople ?? null,
      deadline: d.deadline ? new Date(d.deadline) : null,
      members: { create: [{ userId: session.user.id }] },
    },
  });

  return NextResponse.json({ ok: true, id: pool.id });
}

// List open/formed pools (optionally by city). Excludes expired & removed.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city") || undefined;

  const where: Prisma.GroupPoolWhereInput = {
    status: { in: ["open", "formed"] },
    OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
    ...(cityId ? { cityId } : {}),
  };

  const pools = await prisma.groupPool.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: { where: { status: "joined" } } } } },
    take: 40,
  });

  return NextResponse.json({
    pools: pools.map((p) => ({ id: p.id, joined: p._count.members })),
  });
}
