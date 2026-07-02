// Runs during the Netlify build: creates the schema (db push) and seeds it.
// Netlify's Neon extension injects the read-write DB URL under one of these
// names at build time — we normalize it to DATABASE_URL for the Prisma CLI.
import { execSync } from "node:child_process";

const url =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DB_URL;

if (!url) {
  console.error("netlify-db-setup: no database URL env var found");
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: url };
const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

console.log("netlify-db-setup: applying schema (prisma db push)...");
run("prisma db push --accept-data-loss --skip-generate");

// Seeding WIPES all rows and reloads demo data, so it must NOT run on every
// deploy — that would destroy real user data. It only runs when RUN_SEED=1 is
// set as a Netlify env var. Use it for a one-off seed, then remove the var.
console.log(`netlify-db-setup: RUN_SEED=${JSON.stringify(process.env.RUN_SEED)}`);
if (process.env.RUN_SEED === "1") {
  console.log("netlify-db-setup: RUN_SEED=1 → seeding (wipes + reloads demo data)...");
  run("prisma db seed");

  // Prove the seed actually landed in the same DB the app reads at runtime.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: url });
  const [cities, places] = await Promise.all([
    prisma.city.count(),
    prisma.place.count(),
  ]);
  await prisma.$disconnect();
  console.log(`netlify-db-setup: post-seed counts → cities=${cities} places=${places}`);
  if (cities === 0 || places === 0) {
    console.error("netlify-db-setup: seed ran but tables are empty — failing build.");
    process.exit(1);
  }
} else {
  console.log("netlify-db-setup: skipping seed (set RUN_SEED=1 to seed once).");
}

console.log("netlify-db-setup: done.");
