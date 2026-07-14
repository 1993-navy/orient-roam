import { prisma } from "@/lib/prisma";
import { PlannerForm } from "@/components/PlannerForm";

// AI 路线规划 — collect a traveller's preferences and generate a day-by-day
// itinerary for a city from our own place data (optionally via an LLM).
export const metadata = {
  title: "AI Trip Planner · Orient Roam",
  description:
    "Tell us what you love and we'll build a day-by-day plan for your city — attractions matched to your interests and meals to your taste.",
};

export default async function PlannerPage() {
  const cities = await prisma.city.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div>
        <h1 className="text-3xl font-bold">🧭 AI Trip Planner</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tell us your tastes and we&apos;ll draft a day-by-day route for your city —
          attractions matched to what you love, meals to your palate.
        </p>
      </div>

      <div className="mt-6">
        <PlannerForm cities={cities} />
      </div>
    </div>
  );
}
