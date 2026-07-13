import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validations";
import { checkText } from "@/lib/moderation";

// POST /api/feedback — submit free-form user feedback (提意见). Works for both
// signed-in and signed-out users; the userId is attached when available so
// admins can follow up. Distinct from /api/reports (which targets an entity).
export async function POST(req: Request) {
  const session = await auth();

  const data = await req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { category, message, email } = parsed.data;

  // Keyword screen so obvious abuse doesn't reach the queue.
  const flag = checkText(message);
  if (!flag.ok) {
    return NextResponse.json({ error: flag.reason }, { status: 400 });
  }

  await prisma.feedback.create({
    data: {
      userId: session?.user?.id ?? null,
      category,
      message,
      email: email || null,
    },
  });

  return NextResponse.json({ ok: true });
}
