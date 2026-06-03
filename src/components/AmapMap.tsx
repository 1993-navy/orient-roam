"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/i18n";

export type MapMarker = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  category: string;
  rating?: number;
};

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY ?? "";
const AMAP_SECURITY = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE ?? "";

export function AmapMap({
  center,
  markers,
  zoom = 11,
  height = 420,
}: {
  center: { lng: number; lat: number };
  markers: MapMarker[];
  zoom?: number;
  height?: number;
}) {
  // No key configured → graceful placeholder so the app still runs.
  if (!AMAP_KEY) {
    return <MapPlaceholder markers={markers} height={height} />;
  }
  return <AmapCanvas center={center} markers={markers} zoom={zoom} height={height} />;
}

function AmapCanvas({
  center,
  markers,
  zoom,
  height,
}: {
  center: { lng: number; lat: number };
  markers: MapMarker[];
  zoom: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // If the map hasn't finished rendering in time (e.g. the key is over its
    // daily quota and the loader returns an error body instead of JS, leaving
    // AMapLoader.load hanging), fall back to the placeholder list.
    const failTimer = setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, 8000);

    // The Amap loader touches `window` at import time, so it must only load on
    // the client (dynamic import inside the effect, never at module scope).
    (async () => {
      if (AMAP_SECURITY) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY };
      }
      const { default: AMapLoader } = await import("@amap/amap-jsapi-loader");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AMap: any = await AMapLoader.load({
        key: AMAP_KEY,
        version: "2.0",
        plugins: ["AMap.InfoWindow"],
      });
      if (cancelled || !ref.current) return;

      const map = new AMap.Map(ref.current, {
        zoom,
        center: [center.lng, center.lat],
      });
      mapRef.current = map;
      map.on("complete", () => clearTimeout(failTimer));

      for (const m of markers) {
        const marker = new AMap.Marker({ position: [m.lng, m.lat], title: m.name });
        const info = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -30),
          content: `<div style="font-size:13px;max-width:200px">
              <strong>${escapeHtml(m.name)}</strong>
              ${m.rating ? `<div>⭐ ${m.rating.toFixed(1)}</div>` : ""}
              <a href="/place/${m.id}" style="color:#e11d48;font-weight:600">View details →</a>
            </div>`,
        });
        marker.on("click", () => info.open(map, [m.lng, m.lat]));
        map.add(marker);
      }
    })().catch((e: unknown) => {
      console.error("AMap load failed", e);
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      clearTimeout(failTimer);
      if (mapRef.current) {
        mapRef.current.destroy?.();
        mapRef.current = null;
      }
    };
  }, [center.lng, center.lat, zoom, markers]);

  // If the key needs a security code or the domain isn't whitelisted, the loader
  // throws — fall back to the placeholder list instead of a blank box.
  if (failed) return <MapPlaceholder markers={markers} height={height} />;

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-2xl" />;
}

function MapPlaceholder({ markers, height }: { markers: MapMarker[]; height: number }) {
  return (
    <div
      style={{ minHeight: height }}
      className="flex flex-col rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300">
        🗺️ Locations
        <span className="font-normal text-neutral-500">
          (interactive map unavailable right now — showing the list)
        </span>
      </div>
      <ul className="grid flex-1 gap-2 overflow-auto sm:grid-cols-2">
        {markers.map((m) => (
          <li key={m.id}>
            <Link
              href={`/place/${m.id}`}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span>{CATEGORY_LABELS[m.category]?.emoji ?? "📍"}</span>
              <span className="flex-1 truncate font-medium">{m.name}</span>
              {m.rating ? <span className="text-amber-500">⭐{m.rating.toFixed(1)}</span> : null}
              <span className="text-[11px] text-neutral-400">
                {m.lat.toFixed(3)}, {m.lng.toFixed(3)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
