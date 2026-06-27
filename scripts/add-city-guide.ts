/**
 * Fill bilingual "city guide" rich text (history / culture / cuisine /
 * landmarks / stories, each in zh + en) for cities that are missing it.
 *
 * Source: scripts/guide-1..4.json (curated bilingual content per city).
 * Idempotent: for each city, only fields that are currently null/empty are
 * written — existing content is never overwritten. Safe to re-run.
 *
 * Run:  npx tsx scripts/add-city-guide.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const FIELDS = [
  "history", "historyEn", "culture", "cultureEn", "cuisine", "cuisineEn",
  "landmarks", "landmarksEn", "stories", "storiesEn",
] as const;

type Guide = { cityNameEn: string } & Partial<Record<(typeof FIELDS)[number], string>>;

function loadData(): Guide[] {
  const files = ["guide-1.json", "guide-2.json", "guide-3.json", "guide-4.json"];
  const out: Guide[] = [];
  for (const f of files) {
    const raw = readFileSync(join(__dirname, f), "utf8");
    const parsed = JSON.parse(raw) as Guide[]; // throws loudly on malformed JSON
    out.push(...parsed);
  }
  return out;
}

async function main() {
  const data = loadData();
  console.log(`Loaded guide content for ${data.length} cities (JSON valid).`);

  let updated = 0;
  const summary: string[] = [];

  for (const g of data) {
    const city = await prisma.city.findFirst({ where: { nameEn: g.cityNameEn } });
    if (!city) {
      summary.push(`MISS  ${g.cityNameEn} — no such city in DB`);
      continue;
    }
    const patch: Record<string, string> = {};
    for (const f of FIELDS) {
      const current = (city as Record<string, unknown>)[f];
      const incoming = g[f];
      if ((current === null || current === undefined || current === "") && incoming) {
        patch[f] = incoming;
      }
    }
    if (Object.keys(patch).length === 0) {
      summary.push(`skip  ${g.cityNameEn} — already has guide content`);
      continue;
    }
    await prisma.city.update({ where: { id: city.id }, data: patch });
    updated++;
    summary.push(`ok    ${g.cityNameEn.padEnd(13)} filled ${Object.keys(patch).length} fields`);
  }

  console.log(summary.join("\n"));
  console.log(`\nDone. updated ${updated} cities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
