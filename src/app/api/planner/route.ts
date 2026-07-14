import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkText } from "@/lib/moderation";
import { getPlaceForeignerTagMap } from "@/lib/places";
import {
  generateItinerary,
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  type InterestKey,
  type PlannerPlace,
} from "@/lib/planner";

// Give the model enough time; this can be a slow LLM round-trip.
export const maxDuration = 60;

const interestKeys = INTEREST_OPTIONS.map((o) => o.key) as [string, ...string[]];

const plannerSchema = z.object({
  cityId: z.string().min(1, "Pick a city"),
  days: z.coerce.number().int().min(1).max(7),
  interests: z.array(z.enum(interestKeys)).max(8).default([]),
  pace: z.enum(PACE_OPTIONS).default("balanced"),
  cuisineLikes: z.string().max(300).default(""),
  dietary: z.string().max(300).default(""),
  notes: z.string().max(500).default(""),
});

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const parsed = plannerSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Screen the free-text fields so the prompt can't be used to smuggle abuse.
  const flag = checkText(d.cuisineLikes, d.dietary, d.notes);
  if (!flag.ok) return NextResponse.json({ error: flag.reason }, { status: 400 });

  const city = await prisma.city.findUnique({
    where: { id: d.cityId },
    select: { nameEn: true, summary: true, cuisineEn: true, landmarksEn: true },
  });
  if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

  const rows = await prisma.place.findMany({
    where: { cityId: d.cityId, moderationStatus: "approved" },
    orderBy: { weightScore: "desc" },
    take: 120,
    select: {
      id: true,
      nameEn: true,
      category: true,
      description: true,
      priceLevel: true,
      avgRating: true,
      weightScore: true,
    },
  });

  const tagMap = await getPlaceForeignerTagMap(rows.map((r) => r.id));
  const places: PlannerPlace[] = rows.map((r) => ({
    id: r.id,
    name: r.nameEn,
    category: r.category,
    description: r.description,
    priceLevel: r.priceLevel,
    rating: r.avgRating,
    weightScore: r.weightScore,
    foreignerTags: tagMap.get(r.id) ?? [],
  }));

  try {
    const itinerary = await generateItinerary(
      {
        name: city.nameEn,
        summary: city.summary,
        cuisine: city.cuisineEn,
        landmarks: city.landmarksEn,
      },
      {
        days: d.days,
        interests: d.interests as InterestKey[],
        pace: d.pace,
        cuisineLikes: d.cuisineLikes,
        dietary: d.dietary,
        notes: d.notes,
      },
      places,
    );
    return NextResponse.json({ itinerary });
  } catch (err) {
    console.error("[planner] generation failed:", err);
    return NextResponse.json({ error: "Could not generate a plan. Please try again." }, { status: 500 });
  }
}
