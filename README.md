# FormCheck — Coaching Feedback App

Athletes record a movement on their phone and upload the video. Coaches review
it, draw annotations directly on a paused frame, leave a note, and reply with
timestamped comments — all on the same page.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- NextAuth (credentials login, roles: `ATHLETE` / `COACH`)
- Video files stored on local disk (`public/uploads`), behind a small storage
  abstraction in [`src/lib/storage.ts`](src/lib/storage.ts) so it can be
  swapped for S3-compatible storage later

## Local development

Requires Node 20+ and a Postgres database.

```bash
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npm run db:seed         # creates a coach and athlete test account
npm run dev
```

Seeded accounts:

- Coach: `coach@example.com` / `coachpass123`
- Athlete: `athlete@example.com` / `athletepass123`

## Run with Docker (recommended for deployment)

This spins up Postgres + the app, runs migrations automatically, and persists
both the database and uploaded videos in named volumes.

```bash
docker compose up -d --build
docker compose exec app npm run db:seed   # optional: create test accounts
```

The app is available at http://localhost:3000.

For production, set real values for `NEXTAUTH_SECRET` (a long random string)
and `NEXTAUTH_URL` (your public URL) — either in a `.env` file next to
`docker-compose.yml` or as environment variables on your host/PaaS:

```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.example
```

This setup works on any VPS or Docker-friendly platform (Railway, Render,
Fly.io, etc.). Note that platforms without a persistent filesystem (e.g.
Vercel) won't work with the local-disk storage as-is — swap
`src/lib/storage.ts` for an S3-compatible client first.

## How it works

- `/register`, `/login` — sign up as an athlete or coach
- `/dashboard` (athlete) — upload a video with a title and movement type
- `/coach` — list of pending/reviewed submissions
- `/submissions/[id]` — video player; coaches can pause, draw on the frame
  (pen + color picker), attach a note, and save it as a timestamped
  annotation. Both roles can leave timestamped comments that seek the video
  when clicked.

## Project structure

- `prisma/schema.prisma` — data model (`User`, `Submission`, `Annotation`, `Comment`)
- `src/lib/auth.ts` — NextAuth config (credentials provider, JWT sessions, roles)
- `src/lib/storage.ts` — file storage abstraction
- `src/middleware.ts` — route protection and role gating
- `src/app/api/**` — REST API routes for submissions, annotations, comments
- `src/components/VideoAnnotator.tsx` — video player + canvas drawing overlay
- `src/components/CommentThread.tsx` — timestamped comment thread
