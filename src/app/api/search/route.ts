import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search?q= — site-wide command-palette search across cities,
// places, posts and topics. Up to PER hits per group; empty q → empty groups.
const PER = 5;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (!q) {
    return NextResponse.json({ cities: [], places: [], posts: [], tags: [] });
  }
  const like = { contains: q, mode: "insensitive" as const };

  const [cities, places, posts, tags] = await Promise.all([
    prisma.city.findMany({
      where: { OR: [{ name: like }, { nameEn: like }, { province: like }] },
      select: { id: true, name: true, nameEn: true, province: true },
      take: PER,
    }),
    prisma.place.findMany({
      where: { OR: [{ name: like }, { nameEn: like }] },
      select: {
        id: true,
        name: true,
        nameEn: true,
        category: true,
        city: { select: { name: true, nameEn: true } },
      },
      orderBy: [{ weightScore: "desc" }, { reviewCount: "desc" }],
      take: PER,
    }),
    prisma.post.findMany({
      where: { body: like },
      select: {
        id: true,
        body: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PER,
    }),
    prisma.tag.findMany({
      where: { name: like },
      select: { name: true, _count: { select: { posts: true, reviews: true } } },
      take: PER,
    }),
  ]);

  return NextResponse.json({
    cities,
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      category: p.category,
      cityName: p.city.name,
      cityNameEn: p.city.nameEn,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      body: p.body.length > 80 ? `${p.body.slice(0, 80)}…` : p.body,
      authorName: p.author.name,
    })),
    tags: tags.map((t) => ({ name: t.name, count: t._count.posts + t._count.reviews })),
  });
}
