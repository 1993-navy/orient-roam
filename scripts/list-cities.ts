import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const cities = await prisma.city.findMany({ orderBy: [{ tier: "asc" }, { nameEn: "asc" }] });
  const byTier: Record<string, string[]> = {};
  for (const c of cities) (byTier[c.tier] ??= []).push(`${c.name}(${c.nameEn})`);
  for (const t of ["MEGA", "FIRST", "SECOND", "THIRD"]) {
    console.log(`\n[${t}] ${(byTier[t] || []).length}`);
    console.log("  " + (byTier[t] || []).join("、"));
  }
  console.log(`\nTOTAL = ${cities.length}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
