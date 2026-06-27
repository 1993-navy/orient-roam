/**
 * Incremental place loader — tops up each city to 10 FOOD + 10 ATTRACTION
 * WITHOUT wiping existing data.
 *
 * Source data lives in scripts/places-1..4.json (curated real restaurants &
 * attractions, ~12 candidates per category per city). For each city this script:
 *   - counts existing FOOD / ATTRACTION places,
 *   - adds candidates (in order, skipping any whose nameEn or name already
 *     exists in that city) until the category reaches 10.
 * So it is safe to re-run: a city already at 10 is left untouched.
 *
 * Run:  npx tsx scripts/add-places.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const TARGET_PER_CATEGORY = 10;
const CATEGORIES = ["FOOD", "ATTRACTION"] as const;

type Candidate = {
  name: string;
  nameEn: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  priceLevel?: number;
};
type CityData = { cityNameEn: string; places: Candidate[] };

function loadData(): CityData[] {
  const files = ["places-1.json", "places-2.json", "places-3.json", "places-4.json"];
  const out: CityData[] = [];
  for (const f of files) {
    const raw = readFileSync(join(__dirname, f), "utf8");
    out.push(...(JSON.parse(raw) as CityData[]));
  }
  return out;
}

async function main() {
  const data = loadData();
  let created = 0;
  const summary: string[] = [];

  for (const cd of data) {
    const city = await prisma.city.findFirst({ where: { nameEn: cd.cityNameEn } });
    if (!city) {
      summary.push(`MISS  ${cd.cityNameEn} — no such city in DB, skipped`);
      continue;
    }

    const existing = await prisma.place.findMany({ where: { cityId: city.id } });
    // Dedupe against both English and Chinese names already present in the city.
    const seen = new Set<string>();
    for (const p of existing) {
      seen.add(p.nameEn.toLowerCase());
      seen.add(p.name);
    }

    const parts: string[] = [];
    for (const category of CATEGORIES) {
      let have = existing.filter((p) => p.category === category).length;
      const candidates = cd.places.filter((p) => p.category === category);
      let added = 0;
      for (const c of candidates) {
        if (have >= TARGET_PER_CATEGORY) break;
        if (seen.has(c.nameEn.toLowerCase()) || seen.has(c.name)) continue;
        await prisma.place.create({
          data: {
            name: c.name,
            nameEn: c.nameEn,
            category: c.category,
            cityId: city.id,
            lat: c.lat,
            lng: c.lng,
            description: c.description,
            priceLevel: c.priceLevel ?? 2,
          },
        });
        seen.add(c.nameEn.toLowerCase());
        seen.add(c.name);
        have++;
        added++;
        created++;
      }
      parts.push(`${category}=${have}(+${added})`);
    }
    summary.push(`ok    ${cd.cityNameEn.padEnd(13)} ${parts.join(" ")}`);
  }

  console.log(summary.join("\n"));
  console.log(`\nDone. created ${created} new places.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
