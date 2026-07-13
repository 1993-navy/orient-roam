import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { translateText, normalizeDetected } from "@/lib/translate";
import { LOCALE_COOKIE, LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

// POST /api/messages/translate  { items: [{ id, body }], to? }
// Translates each item into the viewer's locale (cookie), skipping any text
// already in that language. Returns { translations: { [id]: { translated, detected } } }.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const items: { id: string; body: string }[] = Array.isArray(data?.items)
    ? data.items
    : [];
  if (items.length === 0) {
    return NextResponse.json({ translations: {} });
  }

  // Target language: explicit `to` if valid, else the locale cookie, else default.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const candidate = (data?.to as string) || cookieLocale || DEFAULT_LOCALE;
  const to: Locale = LOCALES.includes(candidate as Locale)
    ? (candidate as Locale)
    : DEFAULT_LOCALE;

  const translations: Record<string, { translated: string; detected: string }> = {};

  await Promise.all(
    items.slice(0, 50).map(async (item) => {
      if (!item?.id || typeof item.body !== "string" || !item.body.trim()) return;
      const { translated, detected } = await translateText(item.body, to);
      // Skip when the message is already in the target language, or the
      // translation came back identical to the source.
      if (
        normalizeDetected(detected) === to ||
        translated.trim() === item.body.trim()
      ) {
        return;
      }
      translations[item.id] = { translated, detected };
    }),
  );

  return NextResponse.json({ to, translations });
}
