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

console.log("netlify-db-setup: seeding (idempotent)...");
run("prisma db seed");

console.log("netlify-db-setup: done.");
