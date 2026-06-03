import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RatingStars } from "@/components/RatingStars";
import { MessageButton } from "@/components/MessageButton";

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
        orderBy: { createdAt: "desc" },
        include: { place: { select: { id: true, nameEn: true } } },
      },
      _count: { select: { reviews: true, hostedMeetups: true } },
    },
  });

  if (!user) notFound();
  const isMe = session?.user?.id === user.id;
  const canMessage = Boolean(session?.user?.id) && !isMe;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-3xl dark:from-neutral-800 dark:to-neutral-800">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-neutral-500">
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

      <section className="mt-8">
        <h2 className="text-lg font-bold">Recent reviews</h2>
        {user.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/5 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <Link href={`/place/${r.place.id}`} className="font-medium hover:text-rose-600">
                    {r.place.nameEn}
                  </Link>
                  <RatingStars value={r.rating} className="text-sm" />
                </div>
                {r.comment && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
