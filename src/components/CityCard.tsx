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
};

export function CityCard({ city }: { city: CityCardData }) {
  const { locale } = useLang();
  return (
    <Link
      href={`/city/${city.id}`}
      className="group flex flex-col card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold group-hover:text-rose-600">
          {localizedName(city, locale)}
        </h3>
        <span className="text-xs text-neutral-400">{city.province}</span>
      </div>
      {city.summary && (
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{city.summary}</p>
      )}
      <span className="mt-3 text-xs font-medium text-rose-600">
        {city.placeCount} places →
      </span>
    </Link>
  );
}
