"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";

type CityCultureData = {
  history: string | null;
  historyEn: string | null;
  culture: string | null;
  cultureEn: string | null;
  cuisine: string | null;
  cuisineEn: string | null;
  landmarks: string | null;
  landmarksEn: string | null;
  stories: string | null;
  storiesEn: string | null;
};

type TabType = "history" | "culture" | "cuisine" | "landmarks" | "stories";

const TAB_CONFIG: Record<TabType, { en: string; zh: string; emoji: string; color: string }> = {
  history: { en: "History", zh: "历史", emoji: "🏛️", color: "border-amber-500 bg-amber-50" },
  culture: { en: "Culture", zh: "文化", emoji: "🎭", color: "border-purple-500 bg-purple-50" },
  cuisine: { en: "Cuisine", zh: "美食", emoji: "🍜", color: "border-red-500 bg-red-50" },
  landmarks: { en: "Landmarks", zh: "经典景点", emoji: "🗺️", color: "border-blue-500 bg-blue-50" },
  stories: { en: "Stories", zh: "典故传说", emoji: "📖", color: "border-green-500 bg-green-50" },
};

export function CityCultureView({ data }: { data: CityCultureData }) {
  const { locale } = useLang();
  const [activeTab, setActiveTab] = useState<TabType>("history");

  const tabs: TabType[] = ["history", "culture", "cuisine", "landmarks", "stories"];

  const hasContent = (tab: TabType) => {
    const key = locale === "zh" ? tab : `${tab}En`;
    return data[key as keyof typeof data] !== null && data[key as keyof typeof data] !== undefined;
  };

  const getContent = (tab: TabType) => {
    const key = locale === "zh" ? tab : `${tab}En`;
    return data[key as keyof typeof data] as string | null;
  };

  const visibleTabs = tabs.filter(hasContent);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold">📚 {locale === "zh" ? "城市百科" : "City Guide"}</h2>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleTabs.map((tab) => {
          const config = TAB_CONFIG[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${config.color} text-gray-800 shadow-sm`
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span>{config.emoji}</span>
              <span>{config[locale]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        {getContent(activeTab) && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {getContent(activeTab)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}