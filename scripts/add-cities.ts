/**
 * Incremental city loader — adds new cities WITHOUT touching existing data.
 *
 * Unlike prisma/seed.ts (which wipes every table first), this script only
 * `create`s cities that don't already exist (matched by nameEn), so it is safe
 * to run against the live database. Places are intentionally left empty for now
 * — city base info goes live first; representative places can be added later.
 *
 * Run:  npx tsx scripts/add-cities.ts
 *
 * tier mapping (第一财经《2025新一线城市魅力排行榜》):
 *   MEGA   = 一线 (Beijing/Shanghai/Guangzhou/Shenzhen)
 *   FIRST  = 新一线 (15)
 *   SECOND = 二线 (30)
 *   THIRD  = 三线及以下
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type NewCity = {
  name: string;
  nameEn: string;
  province: string;
  lat: number;
  lng: number;
  summary: string;
  tier: string;
  isLivable: boolean;
};

// Batch 1 — provincial capitals & autonomous-region capitals not yet in the DB.
// (Beijing/Shanghai/Guangzhou/Shenzhen/Suzhou and capitals already seeded —
//  Nanjing, Hangzhou, Jinan, Zhengzhou, Wuhan, Changsha, Chengdu, Kunming,
//  Xi'an, Nanning, Tianjin, Chongqing — are skipped automatically by nameEn.)
const CITIES: NewCity[] = [
  { name: "合肥", nameEn: "Hefei", province: "Anhui", lat: 31.8206, lng: 117.2272, tier: "FIRST", isLivable: false, summary: "Capital of Anhui, a fast-rising tech and science hub beside Chaohu Lake." },
  { name: "石家庄", nameEn: "Shijiazhuang", province: "Hebei", lat: 38.0428, lng: 114.5149, tier: "SECOND", isLivable: false, summary: "Capital of Hebei, a major rail hub on the North China Plain." },
  { name: "太原", nameEn: "Taiyuan", province: "Shanxi", lat: 37.8706, lng: 112.5489, tier: "SECOND", isLivable: false, summary: "Capital of Shanxi, an ancient city of Jin culture near famed grottoes and temples." },
  { name: "沈阳", nameEn: "Shenyang", province: "Liaoning", lat: 41.8057, lng: 123.4315, tier: "SECOND", isLivable: false, summary: "Capital of Liaoning, a former Qing imperial city and industrial heart of the Northeast." },
  { name: "长春", nameEn: "Changchun", province: "Jilin", lat: 43.8171, lng: 125.3235, tier: "SECOND", isLivable: false, summary: "Capital of Jilin, China's automobile city, known for film studios and crisp winters." },
  { name: "哈尔滨", nameEn: "Harbin", province: "Heilongjiang", lat: 45.8038, lng: 126.535, tier: "SECOND", isLivable: false, summary: "Capital of Heilongjiang, famed for its Ice and Snow Festival and Russian-influenced architecture." },
  { name: "福州", nameEn: "Fuzhou", province: "Fujian", lat: 26.0745, lng: 119.2965, tier: "SECOND", isLivable: true, summary: "Capital of Fujian, a coastal city of banyan trees, hot springs, and Min cuisine." },
  { name: "南昌", nameEn: "Nanchang", province: "Jiangxi", lat: 28.682, lng: 115.8579, tier: "SECOND", isLivable: false, summary: "Capital of Jiangxi, cradle of the Chinese revolution on the banks of the Gan River." },
  { name: "贵阳", nameEn: "Guiyang", province: "Guizhou", lat: 26.647, lng: 106.6302, tier: "SECOND", isLivable: true, summary: "Capital of Guizhou, a cool-summer highland city ringed by karst mountains." },
  { name: "兰州", nameEn: "Lanzhou", province: "Gansu", lat: 36.0611, lng: 103.8343, tier: "SECOND", isLivable: false, summary: "Capital of Gansu on the Yellow River, a Silk Road gateway and home of hand-pulled beef noodles." },
  { name: "乌鲁木齐", nameEn: "Urumqi", province: "Xinjiang", lat: 43.8256, lng: 87.6168, tier: "SECOND", isLivable: false, summary: "Capital of Xinjiang, a Silk Road crossroads blending diverse cultures and cuisines." },
  { name: "海口", nameEn: "Haikou", province: "Hainan", lat: 20.0444, lng: 110.1989, tier: "THIRD", isLivable: true, summary: "Capital of Hainan, a tropical seaside city of coconut palms and easy island living." },
  { name: "呼和浩特", nameEn: "Hohhot", province: "Inner Mongolia", lat: 40.8426, lng: 111.749, tier: "THIRD", isLivable: false, summary: "Capital of Inner Mongolia, gateway to the grasslands with rich Mongolian heritage." },
  { name: "银川", nameEn: "Yinchuan", province: "Ningxia", lat: 38.4872, lng: 106.2309, tier: "THIRD", isLivable: false, summary: "Capital of Ningxia on the Yellow River, heart of the Western Xia legacy and Hui culture." },
  { name: "西宁", nameEn: "Xining", province: "Qinghai", lat: 36.6171, lng: 101.7782, tier: "THIRD", isLivable: false, summary: "Capital of Qinghai, a high-plateau city and gateway to Qinghai Lake and the Tibetan Plateau." },
  { name: "拉萨", nameEn: "Lhasa", province: "Tibet", lat: 29.652, lng: 91.1721, tier: "THIRD", isLivable: false, summary: "Capital of Tibet, the sacred highland city of the Potala Palace and Tibetan Buddhism." },
];

async function main() {
  let added = 0;
  let skipped = 0;
  for (const c of CITIES) {
    const existing = await prisma.city.findFirst({ where: { nameEn: c.nameEn } });
    if (existing) {
      skipped++;
      console.log(`skip   ${c.name} (${c.nameEn}) — already exists`);
      continue;
    }
    await prisma.city.create({ data: c });
    added++;
    console.log(`add    ${c.name} (${c.nameEn}) [${c.tier}]`);
  }
  const total = await prisma.city.count();
  console.log(`\nDone. added=${added} skipped=${skipped} total cities now = ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
