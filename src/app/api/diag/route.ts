import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic endpoint — reports which DB the runtime actually connects
// to and its row counts, so we can tell whether seed wrote to a different DB than
// the app reads. Remove after debugging.
export const dynamic = "force-dynamic";

export async function GET() {
  function maskHost(v?: string): string {
    if (!v) return "(unset)";
    const m = /@([^/:]+)/.exec(v);
    return m ? m[1] : "(no-host)";
  }

  const envHosts = {
    DATABASE_URL: maskHost(process.env.DATABASE_URL),
    NETLIFY_DATABASE_URL_UNPOOLED: maskHost(process.env.NETLIFY_DATABASE_URL_UNPOOLED),
    NETLIFY_DATABASE_URL: maskHost(process.env.NETLIFY_DATABASE_URL),
  };

  let counts: Record<string, number> | { error: string };
  try {
    const [cities, places, users] = await Promise.all([
      prisma.city.count(),
      prisma.place.count(),
      prisma.user.count(),
    ]);
    counts = { cities, places, users };
  } catch (e) {
    counts = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ envHosts, counts });
}
