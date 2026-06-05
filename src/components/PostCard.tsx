"use client";

import Link from "next/link";
import { HashtagText } from "@/lib/hashtags";
import { LikeButton } from "@/components/LikeButton";
import { Avatar } from "@/components/Avatar";

export type PostCardData = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  cityName: string | null;
  likeCount: number;
  liked: boolean;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="card p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-2">
        <Avatar name={post.authorName} className="h-9 w-9 text-sm" square />
        <div className="min-w-0">
          <Link
            href={`/profile/${post.authorId}`}
            className="font-semibold hover:text-rose-600"
          >
            {post.authorName}
          </Link>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {post.cityName && <span>· {post.cityName}</span>}
          </div>
        </div>
      </div>

      <HashtagText
        text={post.body}
        className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200"
      />

      <div className="mt-2">
        <LikeButton
          postId={post.id}
          initialLiked={post.liked}
          initialCount={post.likeCount}
        />
      </div>
    </article>
  );
}
