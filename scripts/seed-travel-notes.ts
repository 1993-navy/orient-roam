/**
 * Seed representative "travel notes" (旅行笔记) into the community feed — DIARY
 * posts tied to a city, each with a photo, authored by editor accounts. These
 * give the community feed real content out of the box.
 *
 * Idempotent: notes are keyed by (authorId, title); an existing note with the
 * same title by the same editor is skipped. Safe to re-run.
 *
 * Run:  npx tsx scripts/seed-travel-notes.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Note = {
  cityNameEn: string;
  author: string; // editor display name
  title: string;
  body: string;
  photo: string; // external image URL
};

// Editor accounts that "author" the seeded notes.
const EDITORS = [
  { email: "editor.mia@orientroam.com", name: "Mia (Editor)", homeCountry: "United States" },
  { email: "editor.leo@orientroam.com", name: "Leo (Editor)", homeCountry: "United Kingdom" },
  { email: "editor.ana@orientroam.com", name: "Ana (Editor)", homeCountry: "Spain" },
];

const NOTES: Note[] = [
  {
    cityNameEn: "Beijing",
    author: "Mia (Editor)",
    title: "48 hours in Beijing: walls, ducks & hutongs",
    body:
      "Started at the Forbidden City before the crowds, then climbed a quiet stretch of the Great Wall at Mutianyu. Dinner was crispy Peking duck near Qianmen. Pro tip: buy Wall tickets online and take the cable car up, walk down. #beijing #greatwall",
    photo: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&q=80",
  },
  {
    cityNameEn: "Shanghai",
    author: "Leo (Editor)",
    title: "Shanghai after dark: the Bund glow-up",
    body:
      "The Bund at night is unreal — colonial facades on one side, the neon Pudong skyline on the other. Grabbed xiaolongbao in the Old City, then rooftop drinks facing the Oriental Pearl Tower. Take the ferry across the river, it's cheap and the view is better than any tour. #shanghai #thebund",
    photo: "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1200&q=80",
  },
  {
    cityNameEn: "Chengdu",
    author: "Ana (Editor)",
    title: "Pandas, hotpot and slow afternoons in Chengdu",
    body:
      "Morning with the pandas at the breeding base (go early, they nap by noon), afternoon tea in a Kuanzhai Alley courtyard, and a numbing-spicy hotpot to finish. Chengdu moves at a gentler pace — lean into it. #chengdu #panda #hotpot",
    photo: "https://images.unsplash.com/photo-1631172982849-2a7c1a3f6a2c?w=1200&q=80",
  },
  {
    cityNameEn: "Xi'an",
    author: "Mia (Editor)",
    title: "Cycling the Xi'an city wall at golden hour",
    body:
      "Rented a bike on top of the 14th-century city wall and did the full 14km loop as the sun dropped. Earlier, the Terracotta Army genuinely stopped me in my tracks. End the night in the Muslim Quarter for roujiamo and hand-pulled noodles. #xian #history",
    photo: "https://images.unsplash.com/photo-1591040428440-0a4b3d75f6a0?w=1200&q=80",
  },
  {
    cityNameEn: "Hangzhou",
    author: "Leo (Editor)",
    title: "West Lake mornings and Longjing tea",
    body:
      "Walked the causeways around West Lake before 8am — mist on the water, almost empty. Later visited a Longjing tea village in the hills and learned to pan-fry the leaves. Rent a bike; the lakeside paths are made for it. #hangzhou #westlake #tea",
    photo: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=1200&q=80",
  },
  {
    cityNameEn: "Guilin",
    author: "Ana (Editor)",
    title: "Drifting down the Li River through karst peaks",
    body:
      "Took the bamboo raft from Xingping — the stretch that's literally on the ¥20 note. The limestone peaks fading into the haze look unreal in person. Stay in Yangshuo and cycle the countryside the next day. #guilin #lireiver",
    photo: "https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=1200&q=80",
  },
];

async function ensureEditors() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const byName = new Map<string, string>(); // name -> userId
  for (const e of EDITORS) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      create: {
        email: e.email,
        name: e.name,
        passwordHash,
        homeCountry: e.homeCountry,
        languages: "en",
      },
      update: {},
    });
    byName.set(e.name, user.id);
  }
  return byName;
}

async function main() {
  const editors = await ensureEditors();
  let created = 0;
  const summary: string[] = [];

  for (const note of NOTES) {
    const authorId = editors.get(note.author);
    if (!authorId) {
      summary.push(`MISS  "${note.title}" — unknown editor ${note.author}`);
      continue;
    }
    const city = await prisma.city.findFirst({ where: { nameEn: note.cityNameEn } });
    if (!city) {
      summary.push(`MISS  "${note.title}" — no city ${note.cityNameEn}`);
      continue;
    }

    const existing = await prisma.post.findFirst({
      where: { authorId, title: note.title },
      select: { id: true },
    });
    if (existing) {
      summary.push(`skip  ${note.cityNameEn.padEnd(10)} "${note.title}"`);
      continue;
    }

    await prisma.post.create({
      data: {
        authorId,
        kind: "DIARY",
        title: note.title,
        body: note.body,
        cityId: city.id,
        moderationStatus: "approved",
        media: {
          create: [{ url: note.photo, type: "IMAGE", position: 0 }],
        },
      },
    });
    created++;
    summary.push(`ok    ${note.cityNameEn.padEnd(10)} "${note.title}"`);
  }

  console.log(summary.join("\n"));
  console.log(`\nDone. created ${created} travel notes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
