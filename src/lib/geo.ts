// Coordinate-system conversion between GCJ-02 and WGS-84.
//
// China's public map providers (Amap / Baidu / official surveys) use GCJ-02,
// a mandated obfuscation of true WGS-84 coordinates that shifts points by a few
// hundred metres. Our Place rows were entered against Amap, so their lat/lng are
// GCJ-02. International tile providers (OpenStreetMap and friends) render true
// WGS-84, so we must convert on the way out (gcj02ToWgs84) before dropping a
// marker, and on the way in (wgs84ToGcj02) when a user picks a point on an OSM
// map — keeping the stored value in the same GCJ-02 space as before, so no data
// migration is needed and old and new rows stay consistent.
//
// This is the widely-used public-domain "eviltransform" algorithm. It is an
// approximation (accurate to ~1-2 m), which is far below the marker size, so it
// is imperceptible on the map.

const A = 6378245.0; // semi-major axis of the Krasovsky 1940 ellipsoid
const EE = 0.00669342162296594323; // eccentricity squared

// Points outside mainland China are not offset by GCJ-02, so we leave them be.
function outOfChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

// The signed offset (dLat, dLng) that GCJ-02 adds to a WGS-84 point.
function delta(wgsLat: number, wgsLng: number): { dLat: number; dLng: number } {
  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
  let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
  const radLat = (wgsLat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { dLat, dLng };
}

export type LatLng = { lat: number; lng: number };

// GCJ-02 (Amap / stored) → WGS-84 (OpenStreetMap tiles). Use before rendering.
export function gcj02ToWgs84(lat: number, lng: number): LatLng {
  if (outOfChina(lat, lng)) return { lat, lng };
  const { dLat, dLng } = delta(lat, lng);
  // GCJ ≈ WGS + delta(WGS); delta varies slowly, so subtracting delta(GCJ)
  // recovers WGS to ~1 m — good enough for a map marker.
  return { lat: lat - dLat, lng: lng - dLng };
}

// WGS-84 (point picked on an OSM map) → GCJ-02 (kept consistent with our data).
// Use when saving coordinates the user chose on an international map.
export function wgs84ToGcj02(lat: number, lng: number): LatLng {
  if (outOfChina(lat, lng)) return { lat, lng };
  const { dLat, dLng } = delta(lat, lng);
  return { lat: lat + dLat, lng: lng + dLng };
}
