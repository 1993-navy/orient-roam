"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { biLabel } from "@/lib/i18n";

export type CityMediaItem = {
  id: string;
  url: string;
  type: string; // IMAGE | VIDEO
  caption: string | null;
  captionEn: string | null;
};

// Turn common video URLs into an embeddable src. YouTube / Bilibili get iframe
// embeds; anything else (e.g. a direct .mp4) is played with <video>.
function embedInfo(url: string): { kind: "iframe" | "video"; src: string } {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  const bili = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
  if (bili) return { kind: "iframe", src: `https://player.bilibili.com/player.html?bvid=${bili[1]}` };

  return { kind: "video", src: url };
}

// City hero gallery — curated photos/videos shown at the top of a city page
// (replaces the map). Large lead item + thumbnail strip; falls back to the
// city cover image when no curated media exists.
export function CityMediaGallery({
  media,
  fallbackCover,
  cityName,
}: {
  media: CityMediaItem[];
  fallbackCover?: string | null;
  cityName: string;
}) {
  const { locale } = useLang();
  const [active, setActive] = useState(0);

  if (media.length === 0) {
    if (!fallbackCover) return null;
    return (
      <div className="mt-6 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackCover}
          alt={cityName}
          className="h-[360px] w-full object-cover"
        />
      </div>
    );
  }

  const current = media[Math.min(active, media.length - 1)];
  const caption = biLabel(
    { en: current.captionEn ?? current.caption ?? "", zh: current.caption ?? current.captionEn ?? "" },
    locale,
  );

  return (
    <div className="mt-6">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
        {current.type === "VIDEO" ? (
          <VideoFrame url={current.url} title={caption || cityName} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={caption || cityName}
            className="h-[360px] w-full object-cover"
          />
        )}
        {caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-sm font-medium text-white">{caption}</p>
          </div>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Media ${i + 1}`}
              className={`relative h-16 w-24 flex-none overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-rose-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.type === "VIDEO" ? videoPoster(m.url) : m.url}
                alt=""
                className="h-full w-full object-cover"
              />
              {m.type === "VIDEO" && (
                <span className="absolute inset-0 flex items-center justify-center text-lg text-white drop-shadow">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoFrame({ url, title }: { url: string; title: string }) {
  const info = embedInfo(url);
  if (info.kind === "iframe") {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={info.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <video src={info.src} controls className="h-[360px] w-full bg-black object-contain" />
  );
}

// Best-effort thumbnail for a video (YouTube exposes one; otherwise show the URL
// itself, which the browser renders as a broken-image-free empty poster).
function videoPoster(url: string): string {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`;
  return url;
}
