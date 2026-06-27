import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCachedResponse } from "@/lib/cache";

// POST /api/communities  { name, description, cityId }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const name: unknown = data?.name;
  const description: unknown = data?.description;
  const cityId: unknown = data?.cityId;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const community = await prisma.community.create({
    data: {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : undefined,
      cityId: typeof cityId === "string" && cityId ? cityId : undefined,
      ownerId: session.user.id,
      members: {
        create: [{ userId: session.user.id }],
      },
    },
  });

  return NextResponse.json({ id: community.id, name: community.name });
}

// GET /api/communities?cityId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityId = url.searchParams.get("cityId");

  const where = cityId ? { cityId } : {};

  const communities = await prisma.community.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      city: { select: { nameEn: true, name: true } },
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });

  const result = {
    communities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      cityName: c.city?.nameEn ?? c.city?.name ?? null,
      ownerName: c.owner.name,
      memberCount: c._count.members,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return createCachedResponse(result, {
    maxAge: 600,
    staleWhileRevalidate: 1800,
  });
}