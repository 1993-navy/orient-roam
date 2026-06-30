import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ModerationQueue, type QueueItem } from "@/components/ModerationQueue";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const [reports, actions] = await Promise.all([
    prisma.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { name: true } } },
      take: 100,
    }),
    prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
      include: { moderator: { select: { name: true } } },
      take: 20,
    }),
  ]);

  // Batch-resolve reported entities by type.
  const ids = (type: string) =>
    reports.filter((r) => r.targetType === type).map((r) => r.targetId);

  const [meetups, reviews, posts, users, places, pools, dishReviews] = await Promise.all([
    prisma.meetup.findMany({
      where: { id: { in: ids("MEETUP") } },
      select: { id: true, title: true, hostId: true },
    }),
    prisma.review.findMany({
      where: { id: { in: ids("REVIEW") } },
      select: { id: true, comment: true, userId: true, place: { select: { nameEn: true } } },
    }),
    prisma.post.findMany({
      where: { id: { in: ids("POST") } },
      select: { id: true, body: true, authorId: true },
    }),
    prisma.user.findMany({
      where: { id: { in: ids("USER") } },
      select: { id: true, name: true, status: true },
    }),
    prisma.place.findMany({
      where: { id: { in: ids("PLACE") } },
      select: { id: true, nameEn: true },
    }),
    prisma.groupPool.findMany({
      where: { id: { in: ids("POOL") } },
      select: { id: true, title: true, organizerId: true },
    }),
    prisma.dishReview.findMany({
      where: { id: { in: ids("DISH_REVIEW") } },
      select: {
        id: true,
        comment: true,
        userId: true,
        dish: { select: { nameEn: true, place: { select: { nameEn: true } } } },
      },
    }),
  ]);

  const meetupMap = new Map(meetups.map((m) => [m.id, m]));
  const poolMap = new Map(pools.map((p) => [p.id, p]));
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const placeMap = new Map(places.map((p) => [p.id, p]));
  const dishReviewMap = new Map(dishReviews.map((d) => [d.id, d]));

  const items: QueueItem[] = reports.map((r) => {
    let contextTitle = `${r.targetType} ${r.targetId}`;
    let contextBody: string | null = null;
    let suspendUserId: string | null = null;

    if (r.targetType === "MEETUP") {
      const m = meetupMap.get(r.targetId);
      contextTitle = m ? `Meetup: ${m.title}` : "Meetup (deleted)";
      suspendUserId = m?.hostId ?? null;
    } else if (r.targetType === "REVIEW") {
      const rv = reviewMap.get(r.targetId);
      contextTitle = rv ? `Review of ${rv.place?.nameEn ?? "?"}` : "Review (deleted)";
      contextBody = rv?.comment ?? null;
      suspendUserId = rv?.userId ?? null;
    } else if (r.targetType === "POST") {
      const p = postMap.get(r.targetId);
      contextTitle = "Community post";
      contextBody = p?.body ?? null;
      suspendUserId = p?.authorId ?? null;
    } else if (r.targetType === "USER") {
      const u = userMap.get(r.targetId);
      contextTitle = u ? `User: ${u.name}${u.status === "suspended" ? " (suspended)" : ""}` : "User (deleted)";
      suspendUserId = r.targetId;
    } else if (r.targetType === "POOL") {
      const pool = poolMap.get(r.targetId);
      contextTitle = pool ? `Pool: ${pool.title}` : "Pool (deleted)";
      suspendUserId = pool?.organizerId ?? null;
    } else if (r.targetType === "PLACE") {
      const pl = placeMap.get(r.targetId);
      contextTitle = pl ? `Place: ${pl.nameEn}` : "Place (deleted)";
    } else if (r.targetType === "DISH_REVIEW") {
      const dr = dishReviewMap.get(r.targetId);
      contextTitle = dr
        ? `Dish review: ${dr.dish.nameEn} @ ${dr.dish.place.nameEn}`
        : "Dish review (deleted)";
      contextBody = dr?.comment ?? null;
      suspendUserId = dr?.userId ?? null;
    }

    return {
      reportId: r.id,
      reporterName: r.reporter.name,
      reason: r.reason,
      detail: r.detail,
      createdAt: r.createdAt.toISOString(),
      targetType: r.targetType,
      targetId: r.targetId,
      contextTitle,
      contextBody,
      canHide: ["REVIEW", "POST", "MEETUP", "POOL", "DISH_REVIEW"].includes(r.targetType),
      canSuspend: Boolean(suspendUserId),
      suspendUserId,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛡 Moderation</h1>
        <Link href="/admin/places" className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">
          ➕ Add a place
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {items.length} open report{items.length === 1 ? "" : "s"}
      </p>

      <section className="mt-6">
        <ModerationQueue items={items} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Recent actions</h2>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No actions yet.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {actions.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-2">
                <span className="font-medium">{a.moderator.name}</span>
                <span className="text-rose-600">{a.action}</span>
                <span className="text-neutral-400">
                  {a.targetType} · {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
