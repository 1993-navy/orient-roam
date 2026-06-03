# 🧭 Orient Roam

A community travel guide for foreigners exploring China. Discover **where to eat,
what to see, where to sleep, historic sites and nature** — picked by travelers,
**ranked by real reviews**, and **pinned on a map**. Registered users can review
places, chat, build communities, and organize meetups (拼饭 / 拼单 / 搭子) — and
keep using it to stay connected after they leave China.

> Status: **MVP skeleton.** The core loop (auth → browse by review-weight → map →
> rate → ranking updates) is fully working. Chat / community / meetups have working
> data models and UI with **polling** (real-time push is a planned next step).

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- **Prisma 6** ORM — SQLite in development, PostgreSQL in production
- **Auth.js (NextAuth v5)** — email + password (bcrypt, JWT sessions)
- **高德地图 / Amap** JS API for maps (with a graceful no-key placeholder)
- Lightweight bilingual UI (English-first + 中文), toggled via a cookie

## Getting started

```bash
npm install
npm run db:migrate     # creates the SQLite DB + Prisma client
npm run db:seed        # 5 cities, 27 places, demo users, reviews, a meetup
npm run dev            # http://localhost:3000
```

> `db:migrate` runs the seed automatically the first time. Use `npm run db:seed`
> to re-seed, or `npm run db:reset` to wipe and rebuild.

### Demo accounts

Sign in with any of these (password is `password123`):

- `alex@orientroam.com`
- `marie@orientroam.com`
- `kenji@orientroam.com`

### Enabling the live map (Amap)

Maps work out of the box as a **placeholder list**. For the real interactive map:

1. Create a free **Web (JS API)** key at <https://console.amap.com/dev/key/app>.
2. Put it in `.env`:

   ```
   NEXT_PUBLIC_AMAP_KEY="your-key"
   NEXT_PUBLIC_AMAP_SECURITY_CODE="your-security-code"   # optional
   ```

3. Restart `npm run dev`.

## How recommendation weighting works

Every review nudges a place's ranking, but a single 5-star rating must not outrank
a place with dozens of good ones. We use a **Bayesian-weighted score**
(`src/lib/recommendation.ts`):

```
weightScore = (avgRating * reviewCount + GLOBAL_AVG * C) / (reviewCount + C)
```

It's recomputed and cached on `Place.weightScore` inside the same transaction as
each review write, so the ranking can never drift from the underlying reviews.
Browse/recommendation lists sort by `weightScore` descending.

## Project structure

```
prisma/
  schema.prisma          data model (portable SQLite ⇄ PostgreSQL)
  seed.ts                demo data
src/
  app/
    page.tsx             landing
    cities/ city/[id]/   city browse
    explore/             ★ ranked places + map + filters
    place/[id]/          place detail, reviews, rating form
    auth/                sign in / sign up
    chat/                conversations + messages (polling)
    community/           communities + meetups (拼饭/拼单/搭子)
    profile/[id]/        user profile
    api/                 signup, reviews, places, messages, conversations, meetups, communities
  components/            AmapMap, PlaceCard, ReviewForm, ChatView, CommunityView, …
  lib/                   prisma, auth, recommendation, validations, i18n
```

## Mobile & PWA

- **Responsive, X-style chrome**: a left navigation rail on desktop, a compact top
  bar plus a 4-tab bottom bar (Home · Explore · Community · Chat) on mobile.
- **Installable PWA**: `public/manifest.webmanifest` + a service worker
  (`public/sw.js`, registered by `src/components/ServiceWorker.tsx`) make the app
  "Add to Home Screen"-able with an app icon and full-screen standalone mode.
  Installability requires HTTPS (works on the deployed URL or an https tunnel).

## Deploying to a permanent URL

See **[DEPLOY.md](DEPLOY.md)** for a step-by-step guide (Vercel + Neon Postgres,
~15 min). In short: switch the Prisma `provider` to `"postgresql"`, set
`DATABASE_URL` + `AUTH_SECRET`, `npx prisma db push`, then deploy on Vercel. The
schema is portable (no Prisma enums / scalar lists), so no model changes are
needed.

## Planned next iterations

- Real-time chat over WebSocket (replacing polling)
- Image uploads to object storage
- OAuth sign-in + email verification
- Personalized recommendations, reporting & moderation
