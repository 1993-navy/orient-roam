"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { localizedName } from "@/lib/i18n";

export type CityCardData = {
  id: string;
  name: string;
  nameEn: string;
  province: string;
  summary: string | null;
  placeCount: number;
  isLivable: boolean;
};

export function CityCard({ city }: { city: CityCardData }) {
  const { locale } = useLang();

  return (
    <Link
      href={`/city/${city.id}`}
      className="group flex flex-col card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] animate-fade-in"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold group-hover:text-rose-600 transition-colors duration-200">
            {localizedName(city, locale)}
          </h3>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400">{city.province}</span>
            {city.isLivable && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 transition-all duration-200 hover:scale-105">
                {locale === "zh" ? "宜居城市" : "Livable"}
              </span>
            )}
          </div>
        </div>
      </div>
      {city.summary && (
        <p className="mt-2 line-clamp-2 text-sm text-neutral-500 transition-all duration-300 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
          {city.summary}
        </p>
      )}
      <span className="mt-3 text-xs font-medium text-rose-600 transition-all duration-200 group-hover:translate-x-1">
        {city.placeCount} places →
      </span>
    </Link>
  );
}
