import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { foreignerTagSchema } from "@/lib/validations";

// Toggle the current user's confirmation of a foreigner-friendly tag for a
// place. Returns the tag's new total count and whether the user now confirms it,
// so the client can reconcile its optimistic update.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const parsed = foreignerTagSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { placeId, tag } = parsed.data;
  const userId = session.user.id;
  const where = { placeId_userId_tag: { placeId, userId, tag } };

  const existing = await prisma.placeForeignerTag.findUnique({ where });
  const active = !existing;
  if (existing) {
    await prisma.placeForeignerTag.delete({ where });
  } else {
    await prisma.placeForeignerTag.create({ data: { placeId, userId, tag } });
  }

  const count = await prisma.placeForeignerTag.count({ where: { placeId, tag } });
  return NextResponse.json({ ok: true, active, count });
}
