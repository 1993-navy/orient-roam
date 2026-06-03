import { PrismaClient } from "@prisma/client";

// Resolve the database URL at runtime from whichever variable the host provides.
// Netlify's Neon extension injects NETLIFY_DATABASE_URL(_UNPOOLED) into functions;
// locally we use DATABASE_URL. Order prefers an explicit DATABASE_URL, then the
// read-write Netlify vars.
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DB_URL ||
    undefined
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // When undefined, Prisma falls back to the schema's datasource url.
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
