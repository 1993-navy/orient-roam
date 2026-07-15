"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { PlacePicker } from "@/components/PlacePicker";
import { DIARY_BODY_MAX, MEDIA_BODY_MAX, PLACE_DESCRIPTION_MAX } from "@/lib/validations";

type City = { id: string; nameEn: string; name: string };

// The five things a user can publish. Restaurants / attractions become pending
// Places; diaries / photos / videos become pending Posts. Everything is held
// for review before it goes live.
type Kind = "FOOD" | "ATTRACTION" | "DIARY" | "PHOTO" | "VIDEO";

// A draft loaded back from the server to resume editing.
type PostDraft = {
  id: string;
  kind: "DIARY" | "PHOTO" | "VIDEO";
  title: string | null;
  body: string;
  cityId: string | null;
  media: { url: string; type: string }[];
};
type PlaceDraft = {
  id: string;
  category: "FOOD" | "ATTRACTION";
  name: string;
  nameEn: string;
  cityId: string | null;
  lat: number;
  lng: number;
  address: string | null;
  description: string | null;
  priceLevel: number;
};

const field =
  "mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-950";
const lbl = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function PublishView({ cities }: { cities: City[] }) {
  const { t, locale } = useLang();
  const { status } = useSession();
  const [kind, setKind] = useState<Kind | null>(null);
  // A draft the user chose to resume — passed into the matching form.
  const [editingPost, setEditingPost] = useState<PostDraft | null>(null);
  const [editingPlace, setEditingPlace] = useState<PlaceDraft | null>(null);

  const [postDrafts, setPostDrafts] = useState<PostDraft[]>([]);
  const [placeDrafts, setPlaceDrafts] = useState<PlaceDraft[]>([]);

  const loadDrafts = useCallback(async () => {
    const res = await fetch("/api/publish/drafts");
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (!data) return;
    setPostDrafts(data.posts ?? []);
    setPlaceDrafts(data.places ?? []);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadDrafts();
  }, [status, loadDrafts]);

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

  function resumePost(d: PostDraft) {
    setEditingPlace(null);
    setEditingPost(d);
    setKind(d.kind);
  }
  function resumePlace(d: PlaceDraft) {
    setEditingPost(null);
    setEditingPlace(d);
    setKind(d.category);
  }
  async function discardDraft(type: "post" | "place", id: string) {
    await fetch(`/api/publish/drafts?type=${type}&id=${id}`, { method: "DELETE" });
    loadDrafts();
  }
  // When a form starts fresh (type button clicked) clear any resumed draft.
  function chooseType(k: Kind) {
    setEditingPost(null);
    setEditingPlace(null);
    setKind(k);
  }

  const hasDrafts = postDrafts.length > 0 || placeDrafts.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold">📢 {t.publishTitle}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t.publishSubtitle}</p>

      <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        🛡 {t.publishReviewNotice}
      </div>

      {hasDrafts && (
        <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
          <p className={lbl}>📝 {t.publishDrafts}</p>
          <ul className="mt-2 space-y-2">
            {placeDrafts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-900">
                <span>{d.category === "FOOD" ? "🍜" : "🏯"}</span>
                <span className="flex-1 truncate">{d.nameEn || d.name || t.publishUntitled}</span>
                <button type="button" onClick={() => resumePlace(d)} className="font-medium text-rose-600 hover:underline">
                  {t.publishResume}
                </button>
                <button type="button" onClick={() => discardDraft("place", d.id)} className="text-neutral-400 hover:text-rose-600">
                  {t.publishDelete}
                </button>
              </li>
            ))}
            {postDrafts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-900">
                <span>{d.kind === "DIARY" ? "📔" : d.kind === "PHOTO" ? "🖼️" : "🎬"}</span>
                <span className="flex-1 truncate">{d.title || t.publishUntitled}</span>
                <button type="button" onClick={() => resumePost(d)} className="font-medium text-rose-600 hover:underline">
                  {t.publishResume}
                </button>
                <button type="button" onClick={() => discardDraft("post", d.id)} className="text-neutral-400 hover:text-rose-600">
                  {t.publishDelete}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <p className={lbl}>{t.publishChooseType}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {types.map((ty) => (
            <button
              key={ty.kind}
              type="button"
              onClick={() => chooseType(ty.kind)}
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
            <PlaceForm
              key={editingPlace?.id ?? "new-place"}
              category={kind}
              cities={cities}
              draft={editingPlace}
              onSavedDraft={loadDrafts}
            />
          ) : (
            <PostForm
              key={editingPost?.id ?? "new-post"}
              kind={kind}
              cities={cities}
              draft={editingPost}
              onSavedDraft={loadDrafts}
            />
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
  draft,
  onSavedDraft,
}: {
  category: "FOOD" | "ATTRACTION";
  cities: City[];
  draft: PlaceDraft | null;
  onSavedDraft: () => void;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Track the draft id so repeated "save draft" updates the same row.
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [f, setF] = useState({
    name: draft?.name ?? "",
    nameEn: draft?.nameEn ?? "",
    cityId: draft?.cityId ?? cities[0]?.id ?? "",
    lat: draft?.lat && draft.lat !== 0 ? draft.lat : (null as number | null),
    lng: draft?.lng && draft.lng !== 0 ? draft.lng : (null as number | null),
    priceLevel: draft?.priceLevel ?? 2,
    address: draft?.address ?? "",
    description: draft?.description ?? "",
  });

  const cityName = cities.find((c) => c.id === f.cityId)?.name;

  function payload() {
    return {
      id: draftId ?? undefined,
      category,
      name: f.name,
      nameEn: f.nameEn,
      cityId: f.cityId,
      lat: f.lat ?? undefined,
      lng: f.lng ?? undefined,
      priceLevel: f.priceLevel,
      address: f.address,
      description: f.description,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/publish/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
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

  async function saveDraft() {
    setSavingDraft(true);
    setMsg(null);
    const res = await fetch("/api/publish/place?draft=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    setSavingDraft(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.id) setDraftId(data.id);
      setMsg(t.publishDraftSaved);
      onSavedDraft();
    } else {
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
        <div className="sm:col-span-2">
          <label className={lbl}>{t.placeAddress}</label>
          <input
            value={f.address}
            onChange={(e) => setF({ ...f, address: e.target.value })}
            placeholder={t.placeAddressPlaceholder}
            className={field}
          />
        </div>
      </div>

      {/* Address → map: geocode the address and let the user fine-tune the pin. */}
      <div>
        <label className={lbl}>{t.placeMapLabel}</label>
        <div className="mt-1">
          <PlacePicker
            address={f.address}
            cityName={cityName}
            lat={f.lat}
            lng={f.lng}
            onChange={({ lat, lng }) => setF((prev) => ({ ...prev, lat, lng }))}
          />
        </div>
      </div>

      <div>
        <label className={lbl}>{t.publishBodyField}</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} maxLength={PLACE_DESCRIPTION_MAX} className={field} />
        <p className="mt-1 text-right text-xs text-neutral-400">
          {f.description.length} / {PLACE_DESCRIPTION_MAX}
        </p>
      </div>
      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || !f.nameEn || !f.name || f.lat == null || f.lng == null}
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {busy ? "…" : t.publishSubmit}
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={savingDraft}
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {savingDraft ? "…" : t.publishSaveDraft}
        </button>
      </div>
    </form>
  );
}

// ---- Travel diary / photo / video submission ----
function PostForm({
  kind,
  cities,
  draft,
  onSavedDraft,
}: {
  kind: "DIARY" | "PHOTO" | "VIDEO";
  cities: City[];
  draft: PostDraft | null;
  onSavedDraft: () => void;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [cityId, setCityId] = useState(draft?.cityId ?? "");
  const [urls, setUrls] = useState<string[]>(
    draft && draft.media.length > 0 ? draft.media.map((m) => m.url) : [""],
  );

  const mediaType = kind === "VIDEO" ? "VIDEO" : "IMAGE";
  const needsMedia = kind !== "DIARY";
  // Diaries get the long limit (5000 words); photo / video posts keep 5000 chars.
  const bodyMax = kind === "DIARY" ? DIARY_BODY_MAX : MEDIA_BODY_MAX;

  function setUrl(i: number, v: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? v : u)));
  }

  function payload() {
    const media = urls
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url) => ({ url, type: mediaType }));
    return { id: draftId ?? undefined, kind, title, body, cityId, media };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/publish/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
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

  async function saveDraft() {
    setSavingDraft(true);
    setMsg(null);
    const res = await fetch("/api/publish/post?draft=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    setSavingDraft(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.id) setDraftId(data.id);
      setMsg(t.publishDraftSaved);
      onSavedDraft();
    } else {
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
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={kind === "DIARY" ? 12 : 5} maxLength={bodyMax} className={field} />
        <p className="mt-1 text-right text-xs text-neutral-400">
          {body.length} / {bodyMax}
        </p>
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
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || (needsMedia && !urls.some((u) => u.trim())) || (kind === "DIARY" && !body.trim())}
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {busy ? "…" : t.publishSubmit}
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={savingDraft}
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {savingDraft ? "…" : t.publishSaveDraft}
        </button>
      </div>
    </form>
  );
}
