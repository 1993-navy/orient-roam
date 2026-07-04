"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";

type City = { id: string; nameEn: string; name: string };

// The five things a user can publish. Restaurants / attractions become pending
// Places; diaries / photos / videos become pending Posts. Everything is held
// for review before it goes live.
type Kind = "FOOD" | "ATTRACTION" | "DIARY" | "PHOTO" | "VIDEO";

const field =
  "mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950";
const lbl = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function PublishView({ cities }: { cities: City[] }) {
  const { t, locale } = useLang();
  const { status } = useSession();
  const [kind, setKind] = useState<Kind | null>(null);

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">{t.publishTitle}</h1>
        <p className="mt-4 text-sm text-neutral-500">{t.publishLoginRequired}</p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  const types: { kind: Kind; emoji: string; label: string }[] = [
    { kind: "FOOD", emoji: "🍜", label: t.publishFood },
    { kind: "ATTRACTION", emoji: "🏯", label: t.publishAttraction },
    { kind: "DIARY", emoji: "📔", label: t.publishDiary },
    { kind: "PHOTO", emoji: "🖼️", label: t.publishPhoto },
    { kind: "VIDEO", emoji: "🎬", label: t.publishVideo },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold">📢 {t.publishTitle}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t.publishSubtitle}</p>

      <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        🛡 {t.publishReviewNotice}
      </div>

      <div className="mt-6">
        <p className={lbl}>{t.publishChooseType}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {types.map((ty) => (
            <button
              key={ty.kind}
              type="button"
              onClick={() => setKind(ty.kind)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-4 text-sm font-medium transition ${
                kind === ty.kind
                  ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                  : "border-black/10 hover:bg-neutral-50 dark:border-white/15 dark:hover:bg-neutral-900"
              }`}
            >
              <span className="text-2xl">{ty.emoji}</span>
              {ty.label}
            </button>
          ))}
        </div>
      </div>

      {kind && (
        <div className="mt-6">
          {kind === "FOOD" || kind === "ATTRACTION" ? (
            <PlaceForm category={kind} cities={cities} />
          ) : (
            <PostForm kind={kind} cities={cities} />
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-neutral-400">
        {locale === "zh"
          ? "提交后由管理员审核，通过后才会公开显示。"
          : "After you submit, an admin reviews it; it goes public only once approved."}
      </p>
    </div>
  );
}

// ---- Restaurant / attraction submission ----
function PlaceForm({
  category,
  cities,
}: {
  category: "FOOD" | "ATTRACTION";
  cities: City[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    name: "",
    nameEn: "",
    cityId: cities[0]?.id ?? "",
    lat: "",
    lng: "",
    priceLevel: 2,
    address: "",
    description: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/publish/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, category }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setMsg(t.publishPending);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Failed");
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-rose-600">✓ {t.publishPending}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {t.home}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>{t.dishNameEn}</label>
          <input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} className={field} />
        </div>
        <div>
          <label className={lbl}>{t.dishNameZh}</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
        </div>
        <div>
          <label className={lbl}>{t.cities}</label>
          <select value={f.cityId} onChange={(e) => setF({ ...f, cityId: e.target.value })} className={field}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn} ({c.name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>{t.price} (1–4)</label>
          <input type="number" min={1} max={4} value={f.priceLevel} onChange={(e) => setF({ ...f, priceLevel: Number(e.target.value) })} className={field} />
        </div>
        <div>
          <label className={lbl}>Latitude (高德)</label>
          <input inputMode="decimal" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} placeholder="39.918" className={field} />
        </div>
        <div>
          <label className={lbl}>Longitude (高德)</label>
          <input inputMode="decimal" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} placeholder="116.397" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>{t.placeOptional}</label>
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={field} />
        </div>
      </div>
      <div>
        <label className={lbl}>{t.publishBodyField}</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className={field} />
      </div>
      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <button
        type="submit"
        disabled={busy || !f.nameEn || !f.name || !f.lat || !f.lng}
        className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {busy ? "…" : t.publishSubmit}
      </button>
    </form>
  );
}

// ---- Travel diary / photo / video submission ----
function PostForm({
  kind,
  cities,
}: {
  kind: "DIARY" | "PHOTO" | "VIDEO";
  cities: City[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cityId, setCityId] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);

  const mediaType = kind === "VIDEO" ? "VIDEO" : "IMAGE";
  const needsMedia = kind !== "DIARY";

  function setUrl(i: number, v: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? v : u)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const media = urls
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url) => ({ url, type: mediaType }));
    const res = await fetch("/api/publish/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, title, body, cityId, media }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setMsg(t.publishPending);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Failed");
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-rose-600">✓ {t.publishPending}</p>
        <button
          type="button"
          onClick={() => router.push("/community")}
          className="mt-4 rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {t.community}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div>
        <label className={lbl}>{t.publishTitleField}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={field} />
      </div>
      <div>
        <label className={lbl}>{t.publishBodyField}</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={5000} className={field} />
      </div>
      <div>
        <label className={lbl}>{t.anyCity}</label>
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={field}>
          <option value="">{t.anyCity}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={lbl}>
          {t.publishMediaUrls}
          {needsMedia && " *"}
        </label>
        <div className="mt-1 space-y-2">
          {urls.map((u, i) => (
            <input
              key={i}
              value={u}
              onChange={(e) => setUrl(i, e.target.value)}
              placeholder={kind === "VIDEO" ? "https://…/video.mp4" : "https://…/photo.jpg"}
              className={field}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setUrls((prev) => [...prev, ""])}
          className="mt-2 text-sm font-medium text-rose-600 hover:underline"
        >
          + {t.publishAddMedia}
        </button>
      </div>

      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <button
        type="submit"
        disabled={busy || (needsMedia && !urls.some((u) => u.trim())) || (kind === "DIARY" && !body.trim())}
        className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {busy ? "…" : t.publishSubmit}
      </button>
    </form>
  );
}
