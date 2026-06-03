# Deploying Orient Roam to a permanent URL

This gets the app online 24/7 with a fixed URL, using **Vercel** (hosting, free
tier) + **Neon** (managed PostgreSQL, free tier). Budget ~15 minutes.

Steps marked **[you]** need your own login/credentials — I can't do these for you,
but everything else in the codebase is already deploy-ready.

---

## 1. Create a cloud Postgres (Neon) **[you]**

1. Sign up at <https://neon.tech> (free).
2. Create a project → copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`).

## 2. Switch the schema to PostgreSQL

In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

> The data model is written to be portable (no Prisma enums / scalar lists), so
> nothing else in the schema needs to change.

## 3. Push the schema to Neon + seed

Locally, point `DATABASE_URL` at Neon and create the tables:

```bash
# put the Neon URL in .env (DATABASE_URL=...), then:
npx prisma db push      # creates tables on Neon (no migration files needed)
npm run db:seed         # optional: load demo cities/places/users
```

> We use `db push` rather than `migrate deploy` because the existing migration
> files were generated for SQLite. After this first push you can switch back to
> `prisma migrate` workflows on Postgres if you want versioned migrations.

## 4. Put the code on GitHub **[you]**

```bash
git init && git add -A && git commit -m "Orient Roam MVP"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/orient-roam.git
git push -u origin main
```

## 5. Deploy on Vercel **[you]**

1. Sign up at <https://vercel.com> and **Import** the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build command/output are fine
   as-is (`build` already runs `prisma generate && next build`).
3. Add **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `AUTH_SECRET` | a 32+ char random string (`npx auth secret` prints one) |
   | `NEXT_PUBLIC_AMAP_KEY` | your Amap Web JS key (optional — see below) |
   | `NEXT_PUBLIC_AMAP_SECURITY_CODE` | Amap security code (optional) |

4. Click **Deploy**. You'll get a permanent URL like
   `https://orient-roam.vercel.app` (you can attach a custom domain later).

Auth.js already has `trustHost: true`, so it works on the Vercel domain with no
extra `AUTH_URL` needed.

---

## Enabling the live Amap map (anytime)

The map shows a placeholder list until a key is set. To turn on the real 高德 map:

1. Get a free **Web (JS API)** key at <https://console.amap.com/dev/key/app>.
2. Set `NEXT_PUBLIC_AMAP_KEY` (and optionally `NEXT_PUBLIC_AMAP_SECURITY_CODE`)
   — locally in `.env`, and/or in Vercel's env vars — then redeploy/restart.

No code changes needed; `src/components/AmapMap.tsx` already reads these.

---

## Notes / gotchas

- **Free tiers**: Vercel + Neon free tiers comfortably handle early traffic
  (hundreds–thousands of users). Scale up or migrate to AWS/Oracle later if
  needed — the Postgres data layer makes that portable.
- **Chat** currently uses 4-second polling. For many concurrent users, move it to
  WebSockets/Server-Sent-Events (a planned iteration) to cut request volume.
- **Sessions**: credential + JWT sessions need no session table, so nothing extra
  to provision.
- **Seeding production**: only run `npm run db:seed` if you want the demo data; it
  wipes existing rows first.
