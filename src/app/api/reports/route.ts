import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";

// Submit a report against a meetup / user / review / place. One report per user
// per target (enforced by a unique index) — a duplicate is treated as success
// so the UI can stay idempotent. The moderation queue itself is a later step.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { targetType, targetId, reason, detail } = parsed.data;

  try {
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason,
        detail: detail || null,
      },
    });
  } catch (e) {
    // P2002 = already reported this target; treat as success (idempotent).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: true, alreadyReported: true });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
