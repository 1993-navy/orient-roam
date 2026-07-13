import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ModerationQueue, type QueueItem } from "@/components/ModerationQueue";
import { PendingQueue, type PendingItem } from "@/components/PendingQueue";
import { ReviewedQueue, type ReviewedItem } from "@/components/ReviewedQueue";


const POST_KIND_LABELS: Record<string, string> = {
  DIARY: "Travel diary",
  PHOTO: "Photos",
  VIDEO: "Video",
  NOTE: "Post",
};

const PLACE_KIND_LABELS: Record<string, string> = {
  FOOD: "Restaurant",
  ATTRACTION: "Attraction",
};

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  // User submissions awaiting review (restaurants/attractions + diaries/media).
  const [pendingPlaces, pendingPosts] = await Promise.all([
    prisma.place.findMany({
      where: { moderationStatus: "pending" },
      orderBy: { createdAt: "desc" },
      include: { city: { select: { nameEn: true } } },
      take: 100,
    }),
    prisma.post.findMany({
      where: { moderationStatus: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        city: { select: { nameEn: true } },
        media: { orderBy: { position: "asc" }, select: { url: true } },
      },
      take: 100,
    }),
  ]);

  // Resolve submitter names for pending places in one query.
  const submitterIds = pendingPlaces
    .map((p) => p.submittedById)
    .filter((id): id is string => Boolean(id));
  const submitters = submitterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: submitterIds } },
        select: { id: true, name: true },
      })
    : [];
  const submitterMap = new Map(submitters.map((u) => [u.id, u.name]));

  const pendingItems: PendingItem[] = [
    ...pendingPlaces.map((p) => ({
      id: p.id,
      targetType: "PLACE" as const,
      kindLabel: PLACE_KIND_LABELS[p.category] ?? "Place",
      title: `${p.nameEn} (${p.name})`,
      body: p.description,
      authorName: (p.submittedById && submitterMap.get(p.submittedById)) || "Unknown",
      cityName: p.city?.nameEn ?? null,
      createdAt: p.createdAt.toISOString(),
      mediaUrls: [],
    })),
    ...pendingPosts.map((p) => ({
      id: p.id,
      targetType: "POST" as const,
      kindLabel: POST_KIND_LABELS[p.kind] ?? "Post",
      title: p.title ?? "(untitled)",
      body: p.body || null,
      authorName: p.author.name,
      cityName: p.city?.nameEn ?? null,
      createdAt: p.createdAt.toISOString(),
      mediaUrls: p.media.map((m) => m.url),
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));


  const [reports, actions, reviewedActions, feedbacks] = await Promise.all([

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
    // Recent APPROVE/REJECT decisions on submissions — powers the "reviewed
    // history / undo" list so an admin can change their mind.
    prisma.moderationAction.findMany({
      where: {
        action: { in: ["APPROVE_CONTENT", "REJECT_CONTENT"] },
        targetType: { in: ["PLACE", "POST"] },
      },
      orderBy: { createdAt: "desc" },
      include: { moderator: { select: { name: true } } },
      take: 60,
    }),
    // Latest user feedback (意见反馈) so admins can triage bug reports & ideas.
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
      take: 50,
    }),
  ]);


  // Build the reviewed-history list: keep only the latest decision per target,
  // then resolve the entity's current title/status (skip deleted ones).
  const latestByTarget = new Map<string, (typeof reviewedActions)[number]>();
  for (const a of reviewedActions) {
    const key = `${a.targetType}-${a.targetId}`;
    if (!latestByTarget.has(key)) latestByTarget.set(key, a);
  }
  const reviewedPlaceIds = [...latestByTarget.values()]
    .filter((a) => a.targetType === "PLACE")
    .map((a) => a.targetId);
  const reviewedPostIds = [...latestByTarget.values()]
    .filter((a) => a.targetType === "POST")
    .map((a) => a.targetId);

  const [reviewedPlaces, reviewedPosts] = await Promise.all([
    prisma.place.findMany({
      where: { id: { in: reviewedPlaceIds } },
      select: { id: true, name: true, nameEn: true, category: true, moderationStatus: true },
    }),
    prisma.post.findMany({
      where: { id: { in: reviewedPostIds } },
      select: { id: true, title: true, kind: true, moderationStatus: true },
    }),
  ]);
  const reviewedPlaceMap = new Map(reviewedPlaces.map((p) => [p.id, p]));
  const reviewedPostMap = new Map(reviewedPosts.map((p) => [p.id, p]));

  const reviewedItems: ReviewedItem[] = [...latestByTarget.values()]
    .map((a): ReviewedItem | null => {
      if (a.targetType === "PLACE") {
        const p = reviewedPlaceMap.get(a.targetId);
        if (!p || p.moderationStatus === "pending") return null;
        return {
          id: p.id,
          targetType: "PLACE",
          kindLabel: PLACE_KIND_LABELS[p.category] ?? "Place",
          title: `${p.nameEn} (${p.name})`,
          status: p.moderationStatus === "approved" ? "approved" : "rejected",
          note: a.note,
          moderatorName: a.moderator.name,
          decidedAt: a.createdAt.toISOString(),
        };
      }
      const p = reviewedPostMap.get(a.targetId);
      if (!p || p.moderationStatus === "pending") return null;
      return {
        id: p.id,
        targetType: "POST",
        kindLabel: POST_KIND_LABELS[p.kind] ?? "Post",
        title: p.title ?? "(untitled)",
        status: p.moderationStatus === "approved" ? "approved" : "rejected",
        note: a.note,
        moderatorName: a.moderator.name,
        decidedAt: a.createdAt.toISOString(),
      };
    })
    .filter((x): x is ReviewedItem => x !== null);


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
        {items.length} open report{items.length === 1 ? "" : "s"} · {pendingItems.length} pending submission
        {pendingItems.length === 1 ? "" : "s"}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">📥 Pending submissions</h2>
        <p className="mb-3 mt-1 text-sm text-neutral-500">
          User-submitted restaurants, attractions, diaries, photos and videos awaiting review.
        </p>
        <PendingQueue items={pendingItems} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">🚩 Reports</h2>
        <div className="mt-3">
          <ModerationQueue items={items} />
        </div>
      </section>


      <section className="mt-10">
        <h2 className="text-lg font-bold">🕓 Reviewed · history & undo</h2>
        <p className="mb-3 mt-1 text-sm text-neutral-500">
          Recently approved or rejected submissions. Changed your mind? Undo to
          flip the decision.
        </p>
        <ReviewedQueue items={reviewedItems} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">💬 User feedback</h2>
        <p className="mb-3 mt-1 text-sm text-neutral-500">
          Suggestions, bug reports and ideas submitted via the feedback page.
        </p>
        {feedbacks.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No feedback yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {feedbacks.map((f) => (
              <li key={f.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                    {f.category}
                  </span>
                  <span className="text-neutral-500">
                    {f.user?.name ?? f.email ?? "Anonymous"}
                  </span>
                  <span className="text-neutral-400">
                    · {new Date(f.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                  {f.message}
                </p>
              </li>
            ))}
          </ul>
        )}
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
