/**
 * Seed curated "hero" media (photos + a video) for a city — shown at the top of
 * the city page (replacing the map). MVP: external URLs, no upload.
 *
 * Photos are Unsplash CDN URLs (free to hot-link); the optional video is a
 * YouTube watch URL (the gallery turns it into an embed).
 *
 * Idempotent: media is keyed by (cityId, url); an existing (city, url) pair is
 * skipped, so re-running only adds what's missing. Safe to re-run.
 *
 * Run:  npx tsx scripts/add-city-media.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MediaSeed = {
  url: string;
  type: "IMAGE" | "VIDEO";
  caption: string; // zh
  captionEn: string;
};

// Curated media per city (matched by English name). Keep 3–5 items each: a few
// landmark photos plus one intro video where handy.
const CITY_MEDIA: Record<string, MediaSeed[]> = {
  Beijing: [
    { url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1600&q=80", type: "IMAGE", caption: "故宫角楼", captionEn: "Forbidden City corner tower" },
    { url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1600&q=80", type: "IMAGE", caption: "长城", captionEn: "The Great Wall" },
    { url: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=1600&q=80", type: "IMAGE", caption: "天坛", captionEn: "Temple of Heaven" },
    { url: "https://www.youtube.com/watch?v=uxRxSjbGvUw", type: "VIDEO", caption: "北京城市漫游", captionEn: "Beijing city walk" },
  ],
  Shanghai: [
    { url: "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1600&q=80", type: "IMAGE", caption: "外滩夜景", captionEn: "The Bund at night" },
    { url: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=1600&q=80", type: "IMAGE", caption: "陆家嘴天际线", captionEn: "Lujiazui skyline" },
    { url: "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=1600&q=80", type: "IMAGE", caption: "豫园", captionEn: "Yu Garden" },
  ],
  Chengdu: [
    { url: "https://images.unsplash.com/photo-1631172982849-2a7c1a3f6a2c?w=1600&q=80", type: "IMAGE", caption: "大熊猫", captionEn: "Giant panda" },
    { url: "https://images.unsplash.com/photo-1526481280695-3c469c3c4d5f?w=1600&q=80", type: "IMAGE", caption: "宽窄巷子", captionEn: "Kuanzhai Alley" },
    { url: "https://images.unsplash.com/photo-1567088619726-2b3f9d0a0d5b?w=1600&q=80", type: "IMAGE", caption: "川味火锅", captionEn: "Sichuan hotpot" },
  ],
  "Xi'an": [
    { url: "https://images.unsplash.com/photo-1591040428440-0a4b3d75f6a0?w=1600&q=80", type: "IMAGE", caption: "兵马俑", captionEn: "Terracotta Army" },
    { url: "https://images.unsplash.com/photo-1609520505218-7421df70b7c5?w=1600&q=80", type: "IMAGE", caption: "西安古城墙", captionEn: "Xi'an city wall" },
    { url: "https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=1600&q=80", type: "IMAGE", caption: "大雁塔", captionEn: "Giant Wild Goose Pagoda" },
  ],
  Hangzhou: [
    { url: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=1600&q=80", type: "IMAGE", caption: "西湖", captionEn: "West Lake" },
    { url: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80", type: "IMAGE", caption: "雷峰塔", captionEn: "Leifeng Pagoda" },
    { url: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=80", type: "IMAGE", caption: "龙井茶园", captionEn: "Longjing tea fields" },
  ],
  Guilin: [
    { url: "https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=1600&q=80", type: "IMAGE", caption: "漓江山水", captionEn: "Li River karst scenery" },
    { url: "https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=1600&q=80", type: "IMAGE", caption: "龙脊梯田", captionEn: "Longji rice terraces" },
  ],
};

async function main() {
  let added = 0;
  const summary: string[] = [];

  for (const [cityNameEn, items] of Object.entries(CITY_MEDIA)) {
    const city = await prisma.city.findFirst({ where: { nameEn: cityNameEn } });
    if (!city) {
      summary.push(`MISS  ${cityNameEn} — no such city in DB`);
      continue;
    }

    let cityAdded = 0;
    for (let i = 0; i < items.length; i++) {
      const m = items[i];
      const existing = await prisma.cityMedia.findFirst({
        where: { cityId: city.id, url: m.url },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.cityMedia.create({
        data: {
          cityId: city.id,
          url: m.url,
          type: m.type,
          caption: m.caption,
          captionEn: m.captionEn,
          position: i,
        },
      });
      cityAdded++;
      added++;
    }
    summary.push(`ok    ${cityNameEn.padEnd(10)} +${cityAdded} media`);
  }

  console.log(summary.join("\n"));
  console.log(`\nDone. added ${added} media items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
