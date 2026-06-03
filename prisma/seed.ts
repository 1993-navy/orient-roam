import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeWeightScore } from "../src/lib/recommendation";

const prisma = new PrismaClient();

type SeedPlace = {
  name: string;
  nameEn: string;
  category: string;
  lng: number;
  lat: number;
  address?: string;
  description?: string;
  priceLevel?: number;
};

type SeedCity = {
  name: string;
  nameEn: string;
  province: string;
  lat: number;
  lng: number;
  summary: string;
  places: SeedPlace[];
};

const CITIES: SeedCity[] = [
  {
    name: "北京",
    nameEn: "Beijing",
    province: "Beijing",
    lat: 39.9042,
    lng: 116.4074,
    summary:
      "China's capital — imperial palaces, the Great Wall, and world-class Peking duck.",
    places: [
      { name: "故宫博物院", nameEn: "Forbidden City", category: "ATTRACTION", lng: 116.397, lat: 39.918, description: "The imperial palace of the Ming and Qing dynasties.", priceLevel: 2 },
      { name: "天坛公园", nameEn: "Temple of Heaven", category: "ATTRACTION", lng: 116.412, lat: 39.882, description: "Ming-era altar complex set in a vast park.", priceLevel: 1 },
      { name: "八达岭长城", nameEn: "Badaling Great Wall", category: "NATURE", lng: 116.016, lat: 40.356, description: "The most popular section of the Great Wall.", priceLevel: 2 },
      { name: "全聚德烤鸭店", nameEn: "Quanjude Roast Duck", category: "FOOD", lng: 116.398, lat: 39.899, description: "Historic Peking duck restaurant since 1864.", priceLevel: 3 },
      { name: "后海酒吧街", nameEn: "Houhai Bar Street", category: "NIGHTLIFE", lng: 116.384, lat: 39.94, description: "Lakeside bars and live music in old Beijing.", priceLevel: 2 },
      { name: "王府井大街", nameEn: "Wangfujing Street", category: "SHOPPING", lng: 116.41, lat: 39.914, description: "Beijing's famous pedestrian shopping street.", priceLevel: 2 },
      { name: "北京饭店", nameEn: "Beijing Hotel", category: "HOTEL", lng: 116.408, lat: 39.909, description: "Landmark hotel steps from Tiananmen Square.", priceLevel: 4 },
    ],
  },
  {
    name: "上海",
    nameEn: "Shanghai",
    province: "Shanghai",
    lat: 31.2304,
    lng: 121.4737,
    summary:
      "China's dazzling financial hub — colonial Bund, futuristic skyline, and dumplings.",
    places: [
      { name: "外滩", nameEn: "The Bund", category: "ATTRACTION", lng: 121.49, lat: 31.24, description: "Riverside promenade with colonial-era architecture.", priceLevel: 1 },
      { name: "豫园", nameEn: "Yu Garden", category: "ATTRACTION", lng: 121.492, lat: 31.227, description: "Classical Ming-dynasty garden in the old city.", priceLevel: 2 },
      { name: "南翔馒头店", nameEn: "Nanxiang Steamed Buns", category: "FOOD", lng: 121.492, lat: 31.2272, description: "The original home of Shanghai soup dumplings.", priceLevel: 2 },
      { name: "新天地", nameEn: "Xintiandi", category: "NIGHTLIFE", lng: 121.475, lat: 31.22, description: "Upscale dining and nightlife in restored shikumen.", priceLevel: 3 },
      { name: "田子坊", nameEn: "Tianzifang", category: "SHOPPING", lng: 121.467, lat: 31.211, description: "Artsy lanes full of boutiques and cafes.", priceLevel: 2 },
      { name: "和平饭店", nameEn: "Fairmont Peace Hotel", category: "HOTEL", lng: 121.486, lat: 31.24, description: "Art-deco icon on the Bund.", priceLevel: 4 },
    ],
  },
  {
    name: "西安",
    nameEn: "Xi'an",
    province: "Shaanxi",
    lat: 34.3416,
    lng: 108.9398,
    summary:
      "Ancient capital and Silk Road gateway — the Terracotta Army and legendary street food.",
    places: [
      { name: "秦始皇兵马俑", nameEn: "Terracotta Army", category: "ATTRACTION", lng: 109.278, lat: 34.385, description: "Thousands of life-size clay warriors guarding an emperor's tomb.", priceLevel: 3 },
      { name: "西安城墙", nameEn: "Xi'an City Wall", category: "ATTRACTION", lng: 108.94, lat: 34.26, description: "China's most complete ancient city wall — rent a bike on top.", priceLevel: 2 },
      { name: "回民街", nameEn: "Muslim Quarter", category: "FOOD", lng: 108.94, lat: 34.267, description: "Bustling street-food bazaar of the Hui community.", priceLevel: 1 },
      { name: "大雁塔", nameEn: "Big Wild Goose Pagoda", category: "ATTRACTION", lng: 108.964, lat: 34.219, description: "Tang-dynasty Buddhist pagoda with a nightly fountain show.", priceLevel: 2 },
      { name: "华山", nameEn: "Mount Hua", category: "NATURE", lng: 110.083, lat: 34.479, description: "One of China's Five Great Mountains, famed for vertigo-inducing trails.", priceLevel: 3 },
    ],
  },
  {
    name: "成都",
    nameEn: "Chengdu",
    province: "Sichuan",
    lat: 30.5728,
    lng: 104.0668,
    summary:
      "Laid-back capital of Sichuan — giant pandas, teahouses, and mouth-numbing hotpot.",
    places: [
      { name: "成都大熊猫繁育研究基地", nameEn: "Giant Panda Base", category: "NATURE", lng: 104.146, lat: 30.733, description: "See giant pandas up close, best in the morning.", priceLevel: 2 },
      { name: "锦里古街", nameEn: "Jinli Ancient Street", category: "FOOD", lng: 104.043, lat: 30.643, description: "Snack-packed historic lane beside Wuhou Shrine.", priceLevel: 1 },
      { name: "宽窄巷子", nameEn: "Kuanzhai Alley", category: "ATTRACTION", lng: 104.054, lat: 30.669, description: "Restored Qing-era alleys of teahouses and bars.", priceLevel: 2 },
      { name: "陈麻婆豆腐", nameEn: "Chen Mapo Tofu", category: "FOOD", lng: 104.066, lat: 30.665, description: "Birthplace of the iconic mapo tofu dish.", priceLevel: 2 },
      { name: "青城山", nameEn: "Mount Qingcheng", category: "NATURE", lng: 103.516, lat: 30.901, description: "Misty, forested cradle of Taoism — a UNESCO site.", priceLevel: 2 },
    ],
  },
  {
    name: "桂林",
    nameEn: "Guilin",
    province: "Guangxi",
    lat: 25.2742,
    lng: 110.2907,
    summary:
      "Karst peaks and emerald rivers — the postcard landscape of southern China.",
    places: [
      { name: "漓江", nameEn: "Li River", category: "NATURE", lng: 110.29, lat: 25.273, description: "Cruise past surreal karst mountains to Yangshuo.", priceLevel: 3 },
      { name: "象鼻山", nameEn: "Elephant Trunk Hill", category: "ATTRACTION", lng: 110.295, lat: 25.262, description: "Guilin's emblem — a hill shaped like a drinking elephant.", priceLevel: 2 },
      { name: "芦笛岩", nameEn: "Reed Flute Cave", category: "NATURE", lng: 110.26, lat: 25.31, description: "A glittering, illuminated limestone cave.", priceLevel: 2 },
      { name: "阳朔西街", nameEn: "Yangshuo West Street", category: "NIGHTLIFE", lng: 110.495, lat: 24.778, description: "Lively pedestrian street of bars, cafes and shops.", priceLevel: 2 },
    ],
  },
];

const DEMO_USERS = [
  { email: "alex@orientroam.com", name: "Alex", homeCountry: "United States", languages: "en,es" },
  { email: "marie@orientroam.com", name: "Marie", homeCountry: "France", languages: "fr,en" },
  { email: "kenji@orientroam.com", name: "Kenji", homeCountry: "Japan", languages: "ja,en" },
];

async function main() {
  console.log("Seeding Orient Roam...");

  // Clean (order matters for FK constraints).
  await prisma.meetupParticipant.deleteMany();
  await prisma.meetup.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.place.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = [];
  for (const u of DEMO_USERS) {
    users.push(
      await prisma.user.create({ data: { ...u, passwordHash } }),
    );
  }
  console.log(`  ${users.length} demo users (login with any email + "password123")`);

  // Cities + places
  let placeCount = 0;
  const allPlaceIds: string[] = [];
  for (const c of CITIES) {
    const city = await prisma.city.create({
      data: {
        name: c.name,
        nameEn: c.nameEn,
        province: c.province,
        lat: c.lat,
        lng: c.lng,
        summary: c.summary,
      },
    });
    for (const p of c.places) {
      const place = await prisma.place.create({
        data: {
          name: p.name,
          nameEn: p.nameEn,
          category: p.category,
          cityId: city.id,
          lat: p.lat,
          lng: p.lng,
          address: p.address,
          description: p.description,
          priceLevel: p.priceLevel ?? 2,
        },
      });
      allPlaceIds.push(place.id);
      placeCount++;
    }
  }
  console.log(`  ${CITIES.length} cities, ${placeCount} places`);

  // Seed a few reviews per place so rankings/maps are populated immediately.
  let reviewCount = 0;
  for (const placeId of allPlaceIds) {
    // 1..3 reviewers, ratings skewed positive (3..5).
    const n = 1 + Math.floor(Math.random() * 3);
    const reviewers = [...users].sort(() => Math.random() - 0.5).slice(0, n);
    let sum = 0;
    for (const reviewer of reviewers) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3,4,5
      sum += rating;
      await prisma.review.create({
        data: {
          userId: reviewer.id,
          placeId,
          rating,
          comment: ["Loved it!", "Worth a visit.", "Great experience.", "Highly recommend."][
            Math.floor(Math.random() * 4)
          ],
        },
      });
      reviewCount++;
    }
    const avg = sum / n;
    await prisma.place.update({
      where: { id: placeId },
      data: {
        avgRating: avg,
        reviewCount: n,
        weightScore: computeWeightScore(avg, n),
      },
    });
  }
  console.log(`  ${reviewCount} reviews (weight scores computed)`);

  // A demo community + meetup so the social pages aren't empty.
  const beijing = await prisma.city.findFirst({ where: { nameEn: "Beijing" } });
  const community = await prisma.community.create({
    data: {
      name: "Beijing Newcomers",
      description: "Tips, buddies and meetups for travelers new to Beijing.",
      cityId: beijing?.id,
      ownerId: users[0].id,
      members: {
        create: users.map((u) => ({ userId: u.id })),
      },
    },
  });

  const duck = await prisma.place.findFirst({ where: { nameEn: "Quanjude Roast Duck" } });
  await prisma.meetup.create({
    data: {
      type: "MEAL",
      title: "Peking duck dinner — split the bill!",
      description: "Looking for 2-3 people to share a whole roast duck tonight.",
      cityId: beijing?.id,
      placeId: duck?.id,
      hostId: users[1].id,
      maxPeople: 4,
      participants: { create: [{ userId: users[1].id }] },
    },
  });
  console.log(`  1 community (${community.name}) + 1 meetup`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
