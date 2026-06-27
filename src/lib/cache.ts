import { NextResponse } from "next/server";

export interface CacheOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  cachePrivate?: boolean;
}

export function createCachedResponse(
  data: unknown,
  options: CacheOptions = {},
): NextResponse {
  const {
    maxAge = 60,
    staleWhileRevalidate = 600,
    cachePrivate = false,
  } = options;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set(
    "Cache-Control",
    `${cachePrivate ? "private" : "public"}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
  headers.set("Vary", "Accept, Accept-Language");

  return new NextResponse(JSON.stringify(data), { headers });
}

export function createNoCacheResponse(data: unknown): NextResponse {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  return new NextResponse(JSON.stringify(data), { headers });
}

export function getETag(data: unknown): string {
  const hash = JSON.stringify(data)
    .split("")
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return `"${hash.toString(16).padStart(8, "0")}"`;
}