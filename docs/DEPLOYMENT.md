# Deployment & Infrastructure

FormCheck's primary deployment target is **Vercel**, with PostgreSQL and
video storage as separate managed services. A Docker-based path also exists
for self-hosting.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Prisma `datasource` URL) |
| `NEXTAUTH_SECRET` | Secret used to sign/encrypt NextAuth JWTs |
| `NEXTAUTH_URL` | Canonical app URL NextAuth uses for callbacks |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials for the Google sign-in provider |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token used by `@vercel/blob` for uploaded video storage (not listed in `.env.example` but required — set it alongside the others) |

Copy `.env.example` to `.env` (or `.env.local`) and fill these in for local
development; on Vercel, set them as Project Environment Variables instead.

## Vercel deployment (primary path)

The repo is linked to a Vercel project (`.vercel/project.json`,
project name `wodify-clone`). Deploys happen either via:
- **Git integration**: pushing to the connected branch triggers a build
  automatically, or
- **CLI**: `vercel deploy` for a preview, `vercel deploy --prod` to promote
  straight to production.

Build step (`npm run build`) runs `prisma generate && next build` — Prisma's
client is generated from `prisma/schema.prisma` at build time, so the
`DATABASE_URL` env var must be available during the Vercel build.

Database migrations are **not** run automatically by the Vercel build step;
run `npx prisma migrate deploy` against the production `DATABASE_URL`
separately (e.g. from CI or manually) after a schema change ships.

### Managed services used on Vercel
- **Postgres**: any Postgres-compatible provider works since access is
  purely via `DATABASE_URL` — provision one through the Vercel Marketplace
  (e.g. Neon) and point `DATABASE_URL` at it.
- **Vercel Blob**: stores uploaded video files. Requires
  `BLOB_READ_WRITE_TOKEN` from the linked Blob store. YouTube-linked
  submissions don't use Blob at all.

## Docker (self-hosted alternative)

`docker-compose.yml` defines two services:
- `db`: `postgres:16-alpine`, credentials/db name `wodify`.
- `app`: built from the repo `Dockerfile`, runs
  `npx prisma migrate deploy && npm run start` on boot — so, unlike the
  Vercel path, migrations run automatically here. Needs `DATABASE_URL`,
  `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `BLOB_READ_WRITE_TOKEN` set in the
  environment.

`Dockerfile` is a 3-stage build (`deps` → `builder` → `runner`) on
`node:20-alpine`, runs as a non-root `nextjs` user, and exposes port 3000.
It creates `/app/public/uploads`, a legacy local-upload directory from
before the app moved to Vercel Blob — it's unused in the current upload
flow but harmless to leave in place.

```bash
docker compose up -d --build
docker compose exec app npm run db:seed   # optional: seed test accounts
```

## CI

`.github/workflows/e2e.yml` runs on push/PR:
1. Starts a Postgres service container.
2. `npm ci`, installs the Playwright Chromium browser.
3. `npm run build`.
4. `npm run test:e2e` (Playwright, single worker — tests share one DB and
   Blob token, so they aren't parallelized).
5. Uploads the Playwright report and test results as artifacts.

`playwright.config.ts`: test dir `./e2e`, `globalSetup` at
`e2e/global-setup.ts`, captures traces/screenshots/video on failure. In CI
it boots its own web server; locally it expects the app already running
(e.g. via `docker compose up` or `npm run dev`) on port 3000.

## NPM scripts

| Script | Purpose |
|---|---|
| `dev` | Local dev server |
| `build` | `prisma generate && next build` |
| `start` | Run the production build |
| `lint` | ESLint |
| `db:seed` | Seed a coach + athlete test account (`prisma/seed.ts`) |
| `test:e2e` / `test:e2e:ui` / `test:e2e:report` | Playwright end-to-end tests |

## Operational notes

- Deleting a submission (`DELETE /api/submissions/[id]`) also deletes the
  underlying Vercel Blob object when `videoUrl` points at Blob storage, so
  there's no separate cleanup job needed for orphaned video files.
- Because client uploads go directly to Vercel Blob (not through the Next.js
  server), there's no server-side file-size bottleneck — the 200MB cap is
  enforced by the upload token route, not by streaming the file through a
  serverless function.
