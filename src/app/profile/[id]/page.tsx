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
