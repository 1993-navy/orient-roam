"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DishCard, type DishItem } from "@/components/DishCard";
import { AddDishForm } from "@/components/AddDishForm";
import { useLang } from "@/components/LanguageProvider";

// Dish-level review section: list of dishes (ordered must-try → top-rated by the
// server) plus an "Add a dish" affordance for signed-in users.
export function DishList({ placeId, dishes }: { placeId: string; dishes: DishItem[] }) {
  const { status } = useSession();
  const { t } = useLang();
  const [adding, setAdding] = useState(false);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          🍽️ {t.dishes}
          {dishes.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">
              · {t.sortByRating}
            </span>
          )}
        </h2>
        {status === "authenticated" && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
          >
            + {t.addDish}
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3">
          <AddDishForm placeId={placeId} onDone={() => setAdding(false)} />
        </div>
      )}

      {dishes.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{t.noDishes}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </ul>
      )}
    </section>
  );
}
