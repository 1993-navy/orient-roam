"use client";

import Link from "next/link";
import { HashtagText } from "@/lib/hashtags";
import { LikeButton } from "@/components/LikeButton";
import { PostSaveButton } from "@/components/PostSaveButton";
import { ShareMenu } from "@/components/ShareMenu";
import { PostComments } from "@/components/PostComments";
import { Avatar } from "@/components/Avatar";

export type PostMediaItem = { url: string; type: string };

export type PostCardData = {
  id: string;
  title?: string | null;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  cityName: string | null;
  media?: PostMediaItem[];
  likeCount: number;
  liked: boolean;
  saveCount?: number;
  saved?: boolean;
  shareCount?: number;
  commentCount?: number;
};


export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="card p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg animate-fade-in">
      <div className="flex items-center gap-2">
        <Avatar name={post.authorName} className="h-9 w-9 text-sm transition-transform duration-200 hover:scale-110" square />
        <div className="min-w-0">
          <Link
            href={`/profile/${post.authorId}`}
            className="font-semibold hover:text-rose-600 transition-colors duration-200"
          >
            {post.authorName}
          </Link>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {post.cityName && <span>· {post.cityName}</span>}
          </div>
        </div>
      </div>

      {post.title && (
        <h3 className="mt-2 text-base font-bold leading-snug">{post.title}</h3>
      )}

      <HashtagText
        text={post.body}
        className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200"
      />

      {post.media && post.media.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {post.media.slice(0, 4).map((m, i) =>
            m.type === "VIDEO" ? (
              <video
                key={i}
                src={m.url}
                controls
                className="max-h-80 w-full rounded-xl bg-black object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={m.url}
                alt=""
                className="max-h-80 w-full rounded-xl object-cover"
              />
            ),
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1">
        <LikeButton
          postId={post.id}
          initialLiked={post.liked}
          initialCount={post.likeCount}
        />
        <PostComments postId={post.id} initialCount={post.commentCount ?? 0} />
        <PostSaveButton
          postId={post.id}
          initialSaved={post.saved}
          initialCount={post.saveCount ?? 0}
        />
        <ShareMenu
          kind="post"
          targetId={post.id}
          title={post.authorName}
          path={`/community?post=${post.id}`}
          initialCount={post.shareCount ?? 0}
        />
      </div>
    </article>

  );
}
