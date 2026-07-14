// AI itinerary planner (AI 路线规划).
//
// Given a city, a set of traveller preferences (how many days, which kinds of
// attractions they like, their meal tastes / dietary limits), and the pool of
// places we already have for that city, generateItinerary() produces a
// day-by-day plan: morning/afternoon/evening activities plus meal picks.
//
// It uses any OpenAI-compatible Chat Completions endpoint (GLM / Zhipu, GPT,
// Claude via a gateway, DeepSeek, Moonshot, …) configured through env vars —
// see .env.example (PLANNER_AI_*). It is designed to **fail soft**: if no
// provider is configured, or the call errors/times out/returns garbage, we fall
// back to a deterministic itinerary built by ranking our own place data. So the
// feature always returns something usable, even with no API key.

export const INTEREST_OPTIONS = [
  { key: "history", emoji: "🏛️", label: "History & culture", zh: "历史文化" },
  { key: "nature", emoji: "🏞️", label: "Nature & parks", zh: "自然风光" },
  { key: "food", emoji: "🍜", label: "Food & markets", zh: "美食市集" },
  { key: "art", emoji: "🎨", label: "Art & museums", zh: "艺术博物馆" },
  { key: "nightlife", emoji: "🍸", label: "Nightlife", zh: "夜生活" },
  { key: "shopping", emoji: "🛍️", label: "Shopping", zh: "购物" },
  { key: "family", emoji: "👨‍👩‍👧", label: "Family friendly", zh: "亲子" },
  { key: "relax", emoji: "☕", label: "Slow & relaxed", zh: "悠闲慢节奏" },
] as const;

export type InterestKey = (typeof INTEREST_OPTIONS)[number]["key"];

export const PACE_OPTIONS = ["relaxed", "balanced", "packed"] as const;
export type Pace = (typeof PACE_OPTIONS)[number];

// One place we know about in the target city, trimmed to what the planner needs.
export type PlannerPlace = {
  id: string;
  name: string; // English name preferred for the model
  category: string; // FOOD | ATTRACTION | HOTEL | NATURE | NIGHTLIFE | SHOPPING
  description: string | null;
  priceLevel: number; // 1..4
  rating: number; // avgRating
  weightScore: number; // Bayesian-weighted popularity
  foreignerTags: string[];
};

export type PlannerCity = {
  name: string; // English name
  summary: string | null;
  cuisine: string | null; // English cuisine blurb
  landmarks: string | null; // English landmarks blurb
};

// The user's stated preferences.
export type PlannerPreferences = {
  days: number; // 1..7
  interests: InterestKey[];
  pace: Pace;
  cuisineLikes: string; // free text: "Sichuan, dumplings, coffee"
  dietary: string; // free text: "no pork, vegetarian, peanut allergy"
  notes: string; // anything else
};

// ---- Output shape ---------------------------------------------------------

export type ItineraryActivity = {
  time: string; // e.g. "Morning" / "上午" / "14:00"
  title: string; // what to do
  placeId: string | null; // links back to a Place we know, when applicable
  detail: string; // one or two sentences of why / what
};

export type ItineraryMeal = {
  meal: "breakfast" | "lunch" | "dinner";
  title: string; // dish or restaurant suggestion
  placeId: string | null;
  detail: string;
};

export type ItineraryDay = {
  day: number; // 1-based
  theme: string; // short theme for the day
  activities: ItineraryActivity[];
  meals: ItineraryMeal[];
};

export type Itinerary = {
  cityName: string;
  summary: string; // 1-2 sentence intro to the plan
  days: ItineraryDay[];
  source: "ai" | "fallback"; // how it was produced (shown as a small badge)
  tips: string[]; // a few practical tips
};

// ---- Provider config ------------------------------------------------------

function aiEnabled(): boolean {
  if (!process.env.PLANNER_AI_API_KEY) return false;
  const flag = (process.env.PLANNER_AI ?? "on").toLowerCase();
  return flag === "1" || flag === "true" || flag === "on" || flag === "yes";
}

const AI_TIMEOUT_MS = Number(process.env.PLANNER_AI_TIMEOUT_MS) || 25000;

const CATEGORY_INTEREST: Record<string, InterestKey[]> = {
  FOOD: ["food"],
  ATTRACTION: ["history", "art", "family"],
  NATURE: ["nature", "relax"],
  NIGHTLIFE: ["nightlife"],
  SHOPPING: ["shopping"],
  HOTEL: [],
};

// Build the system + user prompts. We hand the model our real place data so it
// recommends things we can actually deep-link to, and ask for strict JSON back.
function buildMessages(
  city: PlannerCity,
  prefs: PlannerPreferences,
  places: PlannerPlace[],
) {
  const interestLabels = prefs.interests
    .map((k) => INTEREST_OPTIONS.find((o) => o.key === k)?.label ?? k)
    .join(", ");

  // Cap the catalogue we send so the prompt stays small; the best-rated places
  // first so the model has the strongest options.
  const catalogue = [...places]
    .sort((a, b) => b.weightScore - a.weightScore)
    .slice(0, 60)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      priceLevel: p.priceLevel,
      rating: Number(p.rating.toFixed(1)),
      tags: p.foreignerTags,
      about: p.description?.slice(0, 160) ?? "",
    }));

  const system = `You are a local travel planner for foreigners visiting cities in China.
Build a realistic, day-by-day itinerary that matches the traveller's interests, pace and food preferences.
STRICT RULES:
- Prefer places from the provided CATALOGUE and reference them by their exact "id" in "placeId". If you suggest something not in the catalogue, set "placeId" to null.
- Respect dietary restrictions absolutely — never suggest a food that violates them.
- Group nearby activities into the same day to minimise travel. Match the number of activities to the requested pace (relaxed=2-3/day, balanced=3-4/day, packed=4-5/day).
- Every day must include meals appropriate to the traveller's cuisine likes and restrictions.
- Write all human-readable text in clear, friendly English.
Respond with ONLY a compact JSON object, no markdown fences, in exactly this shape:
{"summary":"...","tips":["..."],"days":[{"day":1,"theme":"...","activities":[{"time":"Morning","title":"...","placeId":"<id or null>","detail":"..."}],"meals":[{"meal":"breakfast|lunch|dinner","title":"...","placeId":"<id or null>","detail":"..."}]}]}`;

  const user = JSON.stringify({
    city: { name: city.name, summary: city.summary, cuisine: city.cuisine, landmarks: city.landmarks },
    preferences: {
      days: prefs.days,
      interests: interestLabels || "general sightseeing",
      pace: prefs.pace,
      cuisineLikes: prefs.cuisineLikes || "open to anything",
      dietaryRestrictions: prefs.dietary || "none",
      notes: prefs.notes || "",
    },
    catalogue,
  });

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

// Parse the model reply into days[], tolerating markdown fences / extra prose.
// Returns null if nothing usable was found. We validate/normalize every field
// so a malformed reply can't crash rendering.
function parseItinerary(
  content: string,
  validIds: Set<string>,
): Pick<Itinerary, "summary" | "days" | "tips"> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const daysRaw = Array.isArray(obj.days) ? obj.days : null;
  if (!daysRaw || daysRaw.length === 0) return null;

  const cleanId = (v: unknown): string | null =>
    typeof v === "string" && validIds.has(v) ? v : null;
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  const days: ItineraryDay[] = daysRaw.map((d, i) => {
    const dd = (d ?? {}) as Record<string, unknown>;
    const acts = Array.isArray(dd.activities) ? dd.activities : [];
    const meals = Array.isArray(dd.meals) ? dd.meals : [];
    return {
      day: typeof dd.day === "number" ? dd.day : i + 1,
      theme: str(dd.theme),
      activities: acts.map((a) => {
        const aa = (a ?? {}) as Record<string, unknown>;
        return {
          time: str(aa.time) || "—",
          title: str(aa.title),
          placeId: cleanId(aa.placeId),
          detail: str(aa.detail),
        };
      }).filter((a) => a.title),
      meals: meals.map((m) => {
        const mm = (m ?? {}) as Record<string, unknown>;
        const meal = str(mm.meal).toLowerCase();
        return {
          meal: (["breakfast", "lunch", "dinner"].includes(meal)
            ? meal
            : "lunch") as ItineraryMeal["meal"],
          title: str(mm.title),
          placeId: cleanId(mm.placeId),
          detail: str(mm.detail),
        };
      }).filter((m) => m.title),
    };
  });

  const tips = Array.isArray(obj.tips)
    ? obj.tips.filter((t): t is string => typeof t === "string").slice(0, 6)
    : [];

  return { summary: str(obj.summary), days, tips };
}

// Call the configured OpenAI-compatible endpoint. Returns raw content or null.
async function callProvider(
  messages: { role: "system" | "user"; content: string }[],
): Promise<string | null> {
  const apiKey = process.env.PLANNER_AI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = (process.env.PLANNER_AI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = process.env.PLANNER_AI_MODEL || "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 2500,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[planner] AI provider returned ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[planner] AI call failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Deterministic fallback ----------------------------------------------
//
// No API key (or the call failed): build a sensible plan from our own data.
// We score each attraction by how well its category matches the chosen
// interests, then distribute the top picks across the requested days, and pair
// each day with the best-rated food places.

const PACE_PER_DAY: Record<Pace, number> = { relaxed: 2, balanced: 3, packed: 4 };

function fallbackItinerary(
  city: PlannerCity,
  prefs: PlannerPreferences,
  places: PlannerPlace[],
): Itinerary {
  const interests = new Set<InterestKey>(prefs.interests);
  const scoreFor = (p: PlannerPlace) => {
    const matches = CATEGORY_INTEREST[p.category] ?? [];
    const interestBonus = matches.some((m) => interests.has(m)) ? 3 : 0;
    return p.weightScore + p.rating + interestBonus;
  };

  const foods = places
    .filter((p) => p.category === "FOOD")
    .sort((a, b) => scoreFor(b) - scoreFor(a));
  const sights = places
    .filter((p) => p.category !== "FOOD" && p.category !== "HOTEL")
    .sort((a, b) => scoreFor(b) - scoreFor(a));

  const perDay = PACE_PER_DAY[prefs.pace];
  const days: ItineraryDay[] = [];
  let si = 0;
  let fi = 0;

  for (let d = 0; d < prefs.days; d++) {
    const slots = ["Morning", "Afternoon", "Evening"];
    const activities: ItineraryActivity[] = [];
    for (let k = 0; k < perDay && sights.length > 0; k++) {
      const p = sights[si % sights.length];
      si++;
      activities.push({
        time: slots[Math.min(k, slots.length - 1)],
        title: p.name,
        placeId: p.id,
        detail:
          p.description?.slice(0, 140) ||
          `A well-rated ${p.category.toLowerCase()} spot${p.foreignerTags.length ? ` (${p.foreignerTags.join(", ")})` : ""}.`,
      });
    }

    const pickFood = (meal: ItineraryMeal["meal"]): ItineraryMeal => {
      if (foods.length === 0) {
        return {
          meal,
          title: prefs.cuisineLikes ? `Local ${prefs.cuisineLikes}` : "Local cuisine",
          placeId: null,
          detail: prefs.dietary ? `Keep in mind: ${prefs.dietary}.` : "Ask staff for foreigner-friendly options.",
        };
      }
      const p = foods[fi % foods.length];
      fi++;
      return {
        meal,
        title: p.name,
        placeId: p.id,
        detail:
          p.description?.slice(0, 120) ||
          `Rated ${p.rating.toFixed(1)}★${p.foreignerTags.length ? `, ${p.foreignerTags.join(", ")}` : ""}.`,
      };
    };

    days.push({
      day: d + 1,
      theme: interests.size ? `Day ${d + 1} — your picks` : `Day ${d + 1} highlights`,
      activities,
      meals: [pickFood("breakfast"), pickFood("lunch"), pickFood("dinner")],
    });
  }

  const tips: string[] = [
    "Carry your passport — some venues check ID for foreigners.",
    "Set up a mobile payment app (WeChat Pay / Alipay) before you go.",
  ];
  if (prefs.dietary) tips.push(`Dietary note applied throughout: ${prefs.dietary}.`);
  if (city.cuisine) tips.push(`Local flavor: ${city.cuisine.slice(0, 120)}`);

  return {
    cityName: city.name,
    summary:
      `A ${prefs.days}-day ${prefs.pace} plan for ${city.name}` +
      (prefs.interests.length ? `, focused on ${prefs.interests.join(", ")}.` : "."),
    days,
    source: "fallback",
    tips,
  };
}

// ---- Public entry point ---------------------------------------------------

// Try the AI provider first; on any failure fall back to the deterministic plan
// so the caller always gets a usable itinerary.
export async function generateItinerary(
  city: PlannerCity,
  prefs: PlannerPreferences,
  places: PlannerPlace[],
): Promise<Itinerary> {
  if (aiEnabled()) {
    const messages = buildMessages(city, prefs, places);
    const content = await callProvider(messages);
    if (content) {
      const validIds = new Set(places.map((p) => p.id));
      const parsed = parseItinerary(content, validIds);
      if (parsed && parsed.days.length > 0) {
        return {
          cityName: city.name,
          summary: parsed.summary || `Your ${prefs.days}-day plan for ${city.name}.`,
          days: parsed.days,
          source: "ai",
          tips: parsed.tips,
        };
      }
    }
  }
  return fallbackItinerary(city, prefs, places);
}
