import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publishPlaceSchema, publishPlaceDraftSchema } from "@/lib/validations";
import { screenContentAI } from "@/lib/moderation";


// POST /api/publish/place — a signed-in user submits a restaurant / attraction.
// It is created with moderationStatus = "pending" and stays out of public lists
// until an admin approves it. The submission text is first screened by the
// automatic content filter (spam / negative / gore / political / incitement /
// rumor); flagged submissions are rejected up front.
//
// With `?draft=1` (or `draft: true`) the submission is saved with
// moderationStatus = "draft" instead: validation is relaxed, the AI screen is
// skipped, and it never appears publicly. An `id` updates that draft in place.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to publish." }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const raw = await req.json().catch(() => null);
  const isDraft = url.searchParams.get("draft") === "1" || raw?.draft === true;

  if (isDraft) {
    return saveDraft(raw, userId);
  }

  const parsed = publishPlaceSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const draftId = typeof raw?.id === "string" && raw.id ? raw.id : null;

  const screen = await screenContentAI(d.name, d.nameEn, d.address, d.description);

  if (!screen.ok) {
    return NextResponse.json(
      { error: screen.reason, category: screen.category },
      { status: 400 },
    );
  }

  // Promoting an existing draft to pending: verify ownership first.
  if (draftId) {
    const existing = await prisma.place.findUnique({
      where: { id: draftId },
      select: { submittedById: true, moderationStatus: true },
    });
    if (!existing || existing.submittedById !== userId || existing.moderationStatus !== "draft") {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    const place = await prisma.place.update({
      where: { id: draftId },
      data: {
        name: d.name,
        nameEn: d.nameEn,
        category: d.category,
        cityId: d.cityId,
        lat: d.lat,
        lng: d.lng,
        address: d.address || null,
        description: d.description || null,
        priceLevel: d.priceLevel,
        moderationStatus: "pending",
      },
    });
    return NextResponse.json({ ok: true, id: place.id, status: "pending" });
  }

  const place = await prisma.place.create({
    data: {
      name: d.name,
      nameEn: d.nameEn,
      category: d.category,
      cityId: d.cityId,
      lat: d.lat,
      lng: d.lng,
      address: d.address || null,
      description: d.description || null,
      priceLevel: d.priceLevel,
      moderationStatus: "pending",
      submittedById: userId,
    },
  });

  return NextResponse.json({ ok: true, id: place.id, status: "pending" });
}

// Save (create or update) a draft place. A place row requires lat/lng (they are
// non-null in the schema), so a draft with no coordinates yet is stored at 0,0
// as a placeholder; the map picker fills real values before publish.
async function saveDraft(raw: unknown, userId: string) {
  const parsed = publishPlaceDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const lat = Number.isFinite(d.lat as number) ? (d.lat as number) : 0;
  const lng = Number.isFinite(d.lng as number) ? (d.lng as number) : 0;

  if (d.id) {
    const existing = await prisma.place.findUnique({
      where: { id: d.id },
      select: { submittedById: true, moderationStatus: true },
    });
    if (!existing || existing.submittedById !== userId || existing.moderationStatus !== "draft") {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    const place = await prisma.place.update({
      where: { id: d.id },
      data: {
        name: d.name || "",
        nameEn: d.nameEn || "",
        category: d.category,
        ...(d.cityId ? { cityId: d.cityId } : {}),
        lat,
        lng,
        address: d.address || null,
        description: d.description || null,
        priceLevel: d.priceLevel,
      },
    });
    return NextResponse.json({ ok: true, id: place.id, status: "draft" });
  }

  // A brand-new draft needs a cityId (non-null FK). If the user hasn't picked
  // one yet, we can't persist server-side — ask them to choose a city first.
  if (!d.cityId) {
    return NextResponse.json(
      { error: "Pick a city before saving a draft." },
      { status: 400 },
    );
  }

  const place = await prisma.place.create({
    data: {
      name: d.name || "",
      nameEn: d.nameEn || "",
      category: d.category,
      cityId: d.cityId,
      lat,
      lng,
      address: d.address || null,
      description: d.description || null,
      priceLevel: d.priceLevel,
      moderationStatus: "draft",
      submittedById: userId,
    },
  });
  return NextResponse.json({ ok: true, id: place.id, status: "draft" });
}
