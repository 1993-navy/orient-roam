"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { gcj02ToWgs84, wgs84ToGcj02 } from "@/lib/geo";

// PlacePicker replaces the raw latitude / longitude inputs on the publish form.
// The admin types an address; we geocode it with Nominatim (OpenStreetMap's
// free, keyless service) and drop a draggable marker on a Leaflet/OSM map.
//
// Coordinates are stored as GCJ-02 (consistent with the old Amap data), while
// OSM works in WGS-84. So we convert WGS-84 → GCJ-02 before reporting a point up
// via onChange, and GCJ-02 → WGS-84 when seeding the marker from a stored value.
export function PlacePicker({
  address,
  cityName,
  lat,
  lng,
  onChange,
  height = 300,
}: {
  address: string;
  // City name, used to bias / scope the geocode query.
  cityName?: string;
  lat: number | null; // stored GCJ-02
  lng: number | null;
  onChange: (v: { lat: number; lng: number; address?: string }) => void;
  height?: number;
}) {
  const { t, locale } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Report a WGS-84 point (from the map) as GCJ-02 (for storage).
  const report = (wgsLat: number, wgsLng: number) => {
    const g = wgs84ToGcj02(wgsLat, wgsLng);
    onChangeRef.current({ lat: g.lat, lng: g.lng });
  };

  // Load Leaflet once and build the map + draggable marker.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current) return;
      LRef.current = L;

      const hasPoint = lat != null && lng != null && (lat !== 0 || lng !== 0);
      const start = hasPoint
        ? gcj02ToWgs84(lat as number, lng as number)
        : { lat: 39.918, lng: 116.397 };

      const map = L.map(ref.current).setView([start.lat, start.lng], hasPoint ? 15 : 11);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pin = L.divIcon({
        className: "",
        html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const marker = L.marker([start.lat, start.lng], { icon: pin, draggable: true });
      if (hasPoint) marker.addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        report(pos.lat, pos.lng);
      });

      // Clicking the map moves the marker there.
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        marker.addTo(map);
        report(e.latlng.lat, e.latlng.lng);
      });

      setReady(true);
    })().catch((err) => {
      console.error("PlacePicker map load failed", err);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Init once; the geocode button handles later address/city changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocode the typed address via Nominatim (free OSM service, no key).
  async function locate() {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const query = [address, cityName, "China"].filter(Boolean).join(", ").trim();
    if (!address.trim()) {
      setNote(locale === "zh" ? "请先输入地址" : "Enter an address first");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=" +
        encodeURIComponent(query);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data.length > 0) {
        const wgsLat = parseFloat(data[0].lat);
        const wgsLng = parseFloat(data[0].lon);
        marker.setLatLng([wgsLat, wgsLng]);
        marker.addTo(map);
        map.setView([wgsLat, wgsLng], 16);
        report(wgsLat, wgsLng);
      } else {
        setNote(
          locale === "zh"
            ? "没找到这个地址，可直接点地图选点"
            : "Address not found — tap the map to drop a pin",
        );
      }
    } catch (err) {
      console.error("Nominatim geocode failed", err);
      setNote(
        locale === "zh"
          ? "定位服务暂时不可用，可直接点地图选点"
          : "Geocoding unavailable — tap the map to drop a pin",
      );
    } finally {
      setBusy(false);
    }
  }

  const located = lat != null && lng != null && (lat !== 0 || lng !== 0);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={locate}
        disabled={!ready || busy}
        className="rounded-full border border-rose-300 px-4 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:hover:bg-rose-950/40"
      >
        {busy ? "…" : `📍 ${t.placeLocateOnMap}`}
      </button>
      {note && <p className="text-xs text-amber-600">{note}</p>}
      <div
        ref={ref}
        style={{ height }}
        className="z-0 w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700"
      />
      <p className="text-xs text-neutral-400">
        {located
          ? `${t.placeLocated}: ${lat!.toFixed(5)}, ${lng!.toFixed(5)} · ${t.placeDragHint}`
          : t.placeLocateHint}
      </p>
    </div>
  );
}
