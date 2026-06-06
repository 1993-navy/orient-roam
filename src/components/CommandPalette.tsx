"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/Icon";
import { useDebounce } from "@/hooks/useDebounce";
import { categoryLabel } from "@/lib/i18n";

type Named = { name: string; nameEn: string };
type Results = {
  cities: ({ id: string; province: string } & Named)[];
  places: ({ id: string; category: string; cityName: string; cityNameEn: string } & Named)[];
  posts: { id: string; body: string; authorName: string | null }[];
  tags: { name: string; count: number }[];
};
const EMPTY: Results = { cities: [], places: [], posts: [], tags: [] };

type Flat = { href: string; title: string; sub: string; emoji: string };

// Global ⌘K command palette: one box to search cities, places, posts and
// topics. Opens on Cmd/Ctrl+K or a window "open-command-palette" event (so any
// button can trigger it). Mounted once in the root layout.
export function CommandPalette() {
  const router = useRouter();
  const { locale, t } = useLang();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false); // drives the enter transition
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query.trim(), 200);

  // Global open/close shortcut + custom event.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // Focus + enter transition on open; reset state on close.
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setShow(true);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    setShow(false);
    setQuery("");
    setResults(EMPTY);
    setActive(0);
  }, [open]);

  // Fetch results for the debounced query.
  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((d: Results) => {
        if (!cancelled) {
          setResults(d);
          setActive(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const ln = (o: Named) => (locale === "zh" ? o.name : o.nameEn);

  const groups = useMemo(() => {
    const g: { label: string; items: Flat[] }[] = [];
    if (results.cities.length)
      g.push({
        label: t.cities,
        items: results.cities.map((c) => ({
          href: `/city/${c.id}`,
          title: ln(c),
          sub: c.province,
          emoji: "🏙️",
        })),
      });
    if (results.places.length)
      g.push({
        label: t.places,
        items: results.places.map((p) => ({
          href: `/place/${p.id}`,
          title: ln(p),
          sub: `${categoryLabel(p.category, locale)} · ${locale === "zh" ? p.cityName : p.cityNameEn}`,
          emoji: "📍",
        })),
      });
    if (results.posts.length)
      g.push({
        label: t.feed,
        items: results.posts.map((p) => ({
          href: "/community",
          title: p.body,
          sub: p.authorName ?? "",
          emoji: "💬",
        })),
      });
    if (results.tags.length)
      g.push({
        label: t.topic,
        items: results.tags.map((tg) => ({
          href: `/topic/${encodeURIComponent(tg.name)}`,
          title: `#${tg.name}`,
          sub: `${tg.count} ${t.posts}`,
          emoji: "#️⃣",
        })),
      });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, locale, t]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  function go(item?: Flat) {
    const target = item ?? flat[active];
    if (!target) return;
    setOpen(false);
    router.push(target.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  }

  if (!open) return null;

  let idx = -1;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`h-fit w-full max-w-xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-all duration-150 dark:border-white/10 dark:bg-neutral-950 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-black/5 px-4 dark:border-white/10">
          <Icon name="search" className="h-5 w-5 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.searchEverything}
            className="w-full bg-transparent py-4 text-base outline-none placeholder:text-neutral-400"
          />
          <kbd className="hidden shrink-0 rounded border border-black/10 px-1.5 py-0.5 text-[10px] text-neutral-400 sm:block dark:border-white/15">
            esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!debounced && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">{t.searchEverything}</p>
          )}
          {debounced && !loading && flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">{t.noResults}</p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {group.label}
              </p>
              {group.items.map((item) => {
                idx++;
                const i = idx;
                return (
                  <button
                    key={`${item.href}-${i}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      active === i ? "bg-neutral-100 dark:bg-neutral-900" : ""
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      {item.sub && (
                        <span className="block truncate text-xs text-neutral-400">{item.sub}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
