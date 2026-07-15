"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/i18n";
import { gcj02ToWgs84 } from "@/lib/geo";

export type MapMarker = {
  id: string;
  name: string;
  lng: number; // GCJ-02 (as stored) — converted to WGS-84 for the tiles
  lat: number;
  category: string;
  rating?: number;
};

// Free, keyless map for foreign visitors: OpenStreetMap raster tiles rendered
// with Leaflet. No account, no API key, English labels, and reachable from
// mainland China. Stored coordinates are GCJ-02 (from the old Amap data), so we
// convert each point to WGS-84 before placing it — see src/lib/geo.ts.
export function OsmMap({
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
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Leaflet touches `window`, so import it only on the client.
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current) return;

      const c = gcj02ToWgs84(center.lat, center.lng);
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView(
        [c.lat, c.lng],
        zoom,
      );
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // A small teardrop pin drawn with divIcon, so we ship no image assets and
      // avoid Leaflet's default-icon path issues under bundlers.
      const pin = (emoji: string) =>
        L.divIcon({
          className: "",
          html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -24],
        });

      for (const m of markers) {
        const p = gcj02ToWgs84(m.lat, m.lng);
        const emoji = CATEGORY_LABELS[m.category]?.emoji ?? "📍";
        L.marker([p.lat, p.lng], { icon: pin(emoji), title: m.name })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:13px;max-width:200px">
              <strong>${escapeHtml(m.name)}</strong>
              ${m.rating ? `<div>⭐ ${m.rating.toFixed(1)}</div>` : ""}
              <a href="/place/${m.id}" style="color:#e11d48;font-weight:600">View details →</a>
            </div>`,
          );
      }
    })().catch((e: unknown) => {
      console.error("OSM map load failed", e);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center.lng, center.lat, zoom, markers]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700"
    />
  );
}

// Kept for callers that only want the location list (e.g. no coordinates yet).
export function MapList({ markers, height }: { markers: MapMarker[]; height: number }) {
  return (
    <div
      style={{ minHeight: height }}
      className="flex flex-col rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-neutral-900"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300">
        🗺️ Locations
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
