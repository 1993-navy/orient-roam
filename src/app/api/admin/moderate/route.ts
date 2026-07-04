import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { moderateActionSchema } from "@/lib/validations";
import { recalcPlaceAggregates } from "@/lib/recommendation";
import { recalcDishAggregates } from "@/lib/dishes";

// Admin-only moderation actions. Each action resolves an optional report,
// applies the effect, and writes an audit-log row in one transaction.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json().catch(() => null);
  const parsed = moderateActionSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { reportId, action, targetType, targetId, note } = parsed.data;
  const moderatorId = session.user.id;

  await prisma.$transaction(async (tx) => {
    if (action === "HIDE_CONTENT") {
      if (targetType === "REVIEW") {
        const review = await tx.review.update({
          where: { id: targetId },
          data: { hidden: true },
          select: { placeId: true },
        });
        await recalcPlaceAggregates(review.placeId, tx);
      } else if (targetType === "DISH_REVIEW") {
        const dishReview = await tx.dishReview.update({
          where: { id: targetId },
          data: { hidden: true },
          select: { dishId: true },
        });
        await recalcDishAggregates(dishReview.dishId, tx);
      } else if (targetType === "POST") {
        await tx.post.update({ where: { id: targetId }, data: { hidden: true } });
      } else if (targetType === "MEETUP") {
        await tx.meetup.update({ where: { id: targetId }, data: { status: "removed" } });
      } else if (targetType === "POOL") {
        await tx.groupPool.update({ where: { id: targetId }, data: { status: "removed" } });
      }
    } else if (action === "SUSPEND_USER") {
      await tx.user.update({ where: { id: targetId }, data: { status: "suspended" } });
    } else if (action === "UNSUSPEND_USER") {
      await tx.user.update({ where: { id: targetId }, data: { status: "active" } });
    } else if (action === "APPROVE_CONTENT") {
      // Publish a pending user submission.
      if (targetType === "PLACE") {
        await tx.place.update({
          where: { id: targetId },
          data: { moderationStatus: "approved" },
        });
      } else if (targetType === "POST") {
        await tx.post.update({
          where: { id: targetId },
          data: { moderationStatus: "approved" },
        });
      }
    } else if (action === "REJECT_CONTENT") {
      // Reject a pending user submission (kept in the DB for audit, hidden).
      if (targetType === "PLACE") {
        await tx.place.update({
          where: { id: targetId },
          data: { moderationStatus: "rejected" },
        });
      } else if (targetType === "POST") {
        await tx.post.update({
          where: { id: targetId },
          data: { moderationStatus: "rejected", hidden: true },
        });
      }
    }


    // Resolve the originating report (dismiss vs. acted-upon).
    if (reportId) {
      await tx.report.update({
        where: { id: reportId },
        data: { status: action === "DISMISS" ? "dismissed" : "reviewed" },
      });
    }

    await tx.moderationAction.create({
      data: {
        moderatorId,
        reportId: reportId || null,
        action,
        targetType,
        targetId,
        note: note || null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
