import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RatingStars } from "@/components/RatingStars";
import { MessageButton } from "@/components/MessageButton";
import { UserRatingForm } from "@/components/UserRatingForm";
import { UserRatingCard } from "@/components/UserRatingCard";
import { HashtagText } from "@/lib/hashtags";
import { Avatar } from "@/components/Avatar";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        include: { place: { select: { id: true, nameEn: true } } },
      },
      receivedRatings: {
        orderBy: { createdAt: "desc" },
        include: { rater: { select: { id: true, name: true } } },
        take: 20,
      },
      _count: { select: { reviews: true, hostedMeetups: true } },
    },
  });

  if (!user) notFound();
  const isMe = session?.user?.id === user.id;
  const canMessage = Boolean(session?.user?.id) && !isMe;

  // The user's own submissions and their moderation status (only shown to
  // themselves). Rejected ones surface the moderator's feedback so the author
  // knows what to fix and can resubmit.
  type MySubmission = {
    key: string;
    kindLabel: string;
    title: string;
    status: string; // pending | approved | rejected
    feedback: string | null;
    createdAt: Date;
  };
  let mySubmissions: MySubmission[] = [];
  if (isMe) {
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
    const [myPosts, myPlaces] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: id, moderationStatus: { in: ["pending", "rejected"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, kind: true, moderationStatus: true, createdAt: true },
        take: 50,
      }),
      prisma.place.findMany({
        where: { submittedById: id, moderationStatus: { in: ["pending", "rejected"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, nameEn: true, category: true, moderationStatus: true, createdAt: true },
        take: 50,
      }),
    ]);

    // Pull the latest rejection note per rejected submission from the log.
    const rejectedIds = [
      ...myPosts.filter((p) => p.moderationStatus === "rejected").map((p) => p.id),
      ...myPlaces.filter((p) => p.moderationStatus === "rejected").map((p) => p.id),
    ];
    const feedbackMap = new Map<string, string>();
    if (rejectedIds.length > 0) {
      const notes = await prisma.moderationAction.findMany({
        where: {
          action: "REJECT_CONTENT",
          targetId: { in: rejectedIds },
          note: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: { targetId: true, note: true },
      });
      for (const n of notes) {
        if (n.note && !feedbackMap.has(n.targetId)) feedbackMap.set(n.targetId, n.note);
      }
    }

    mySubmissions = [
      ...myPosts.map((p) => ({
        key: `POST-${p.id}`,
        kindLabel: POST_KIND_LABELS[p.kind] ?? "Post",
        title: p.title ?? "(untitled)",
        status: p.moderationStatus,
        feedback: feedbackMap.get(p.id) ?? null,
        createdAt: p.createdAt,
      })),
      ...myPlaces.map((p) => ({
        key: `PLACE-${p.id}`,
        kindLabel: PLACE_KIND_LABELS[p.category] ?? "Place",
        title: `${p.nameEn} (${p.name})`,
        status: p.moderationStatus,
        feedback: feedbackMap.get(p.id) ?? null,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }


  let hasRated = false;
  if (session?.user?.id && !isMe) {
    const existingRating = await prisma.userRating.findUnique({
      where: { raterId_ratedId: { raterId: session.user.id, ratedId: id } },
    });
    hasRated = Boolean(existingRating);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} className="h-20 w-20 text-3xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <RatingStars value={user.avgRating} className="text-sm" />
                  <span className="text-sm font-semibold text-amber-500">
                    {user.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-400">({user.ratingCount})</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {user.homeCountry ? `🌍 ${user.homeCountry}` : null}
              {user.languages ? ` · 🗣️ ${user.languages}` : null}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {user._count.reviews} reviews · {user._count.hostedMeetups} meetups hosted ·
              joined {user.createdAt.toLocaleDateString()}
            </p>
          </div>
          {canMessage && <MessageButton targetUserId={user.id} />}
        </div>

        {user.bio && <p className="mt-4 text-neutral-700 dark:text-neutral-300">{user.bio}</p>}
      </div>

      {canMessage && !hasRated && (
        <section className="mt-6">
          <UserRatingForm ratedId={user.id} ratedName={user.name} />
        </section>
      )}

      {user.receivedRatings.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">
            Ratings ({user.receivedRatings.length})
          </h2>
          <div className="mt-3 space-y-3">
            {user.receivedRatings.map((rating) => (
              <UserRatingCard
                key={rating.id}
                rating={{
                  id: rating.id,
                  raterId: rating.rater.id,
                  raterName: rating.rater.name,
                  rating: rating.rating,
                  comment: rating.comment,
                  createdAt: rating.createdAt.toISOString(),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {isMe && mySubmissions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">My submissions</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Content you submitted that is awaiting review or was sent back.
          </p>
          <ul className="mt-3 space-y-2">
            {mySubmissions.map((s) => (
              <li key={s.key} className="card p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                    {s.kindLabel}
                  </span>
                  {s.status === "pending" ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                      Pending review
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                      Sent back
                    </span>
                  )}
                  <span className="text-neutral-400">
                    {s.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 font-medium">{s.title}</p>
                {s.status === "rejected" && (
                  <p className="mt-1 rounded-lg bg-rose-50/60 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                    {s.feedback
                      ? `Moderator feedback: ${s.feedback}`
                      : "This didn't pass review. Please revise it and submit again."}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold">Recent reviews</h2>

        {user.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.reviews.map((r) => (
              <li
                key={r.id}
                className="card p-3"
              >
                <div className="flex items-center justify-between">
                  <Link href={`/place/${r.place.id}`} className="font-medium hover:text-rose-600">
                    {r.place.nameEn}
                  </Link>
                  <RatingStars value={r.rating} className="text-sm" />
                </div>
                {r.comment && (
                  <HashtagText
                    text={r.comment}
                    className="mt-1 text-sm text-neutral-600 dark:text-neutral-300"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
