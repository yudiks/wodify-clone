# Architecture

FormCheck is a Next.js 15 (App Router) + TypeScript app with PostgreSQL via
Prisma, NextAuth for authentication, and Vercel Blob for video storage.

## Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL, accessed via Prisma ORM
- **Auth**: NextAuth v5 (beta) — Credentials provider (bcrypt-hashed
  passwords) + Google OAuth, JWT session strategy
- **Video storage**: Vercel Blob (client-side direct upload), or a YouTube
  embed URL stored in place of a file
- **Testing**: Playwright for end-to-end tests, run against a real
  Postgres instance

## Data model (`prisma/schema.prisma`)

```
User
  id, name, email (unique), passwordHash (nullable — null for OAuth-only
  accounts), role (ATHLETE | COACH, default ATHLETE), createdAt
  → submissions (as athlete), annotations (as coach), comments (as author)

Submission
  id, athleteId/athlete, title, movementType (reserved, currently always ""),
  videoUrl, status (PENDING | REVIEWED, default PENDING),
  shareToken (unique, nullable), createdAt
  → annotations, comments (cascade delete)

Annotation
  id, submissionId (cascade delete), coachId/coach, timestampSec (Float),
  drawingDataUrl (PNG data URL; empty string for YouTube-hosted videos,
  which don't support canvas drawing), note, createdAt

Comment
  id, submissionId (cascade delete), authorId/author,
  timestampSec (Float, nullable — untagged comments have no timestamp),
  text, createdAt
```

`Role` and `SubmissionStatus` are Postgres enums.

## Authentication & authorization

- `src/lib/auth.ts` configures NextAuth: Credentials provider validates
  email/password against `passwordHash` with bcryptjs; Google provider
  auto-creates a `User` with role `ATHLETE` on first sign-in if none exists.
- Session strategy is JWT; `role` and `id` are copied onto the token/session
  in the `jwt`/`session` callbacks so role checks don't need a DB round trip
  on every request.
- `src/middleware.ts` wraps `auth()` and:
  - Redirects unauthenticated users to `/login`.
  - Blocks non-`COACH` users from `/coach/*`.
  - Matcher: `/dashboard/:path*`, `/coach/:path*`, `/submissions/:path*`.
- Page- and API-route-level checks layer on top of middleware for
  finer-grained authorization (e.g. "is this user the submission's athlete
  or a coach?").

## Routes

### Pages (`src/app`)
| Route | Purpose |
|---|---|
| `/` | Marketing landing page; redirects signed-in users to `/coach` or `/dashboard` |
| `/login`, `/register` | Credential and Google sign-in/sign-up |
| `/dashboard` | Athlete home — upload form + their own submissions |
| `/coach` | Coach home — all submissions, split Pending/Reviewed |
| `/submissions/[id]` | Submission detail: video, annotations, comments. Accessible to the owning athlete or any coach |
| `/share/[token]` | Public, unauthenticated, read-only view of a single submission |

### API routes (`src/app/api`)
| Route | Purpose |
|---|---|
| `POST /api/register` | Create an account |
| `/api/auth/[...nextauth]` | NextAuth handlers (sign-in, callback, sign-out, session) |
| `GET/POST /api/submissions` | List submissions scoped to the caller's role; create a submission (athlete-only) |
| `POST /api/submissions/upload` | Issues a Vercel Blob client-upload token (athlete-only); restricts file types (mp4/mov/webm/ogv/m4v) and size (200MB cap) |
| `GET/PATCH/DELETE /api/submissions/[id]` | Fetch, update (status or title), or delete a submission. Delete also removes the underlying Blob object |
| `POST /api/submissions/[id]/share` | Generates a `nanoid(12)` share token (owner or coach) |
| `POST /api/submissions/[id]/annotations` | Create a coach annotation |
| `POST /api/submissions/[id]/comments` | Create a comment, optionally timestamped |
| `GET /api/share/[token]` | Public read of a shared submission |

## Video handling

- **File upload**: `UploadForm.tsx` optionally trims the clip client-side
  (canvas/MediaRecorder re-encode based on selected start/end) before
  uploading directly to Vercel Blob via `@vercel/blob/client`'s `upload()`,
  which exchanges a token with `/api/submissions/upload`. The resulting
  Blob URL is stored as `videoUrl`.
- **YouTube link**: `src/lib/youtube.ts` parses `youtube.com`/`youtu.be`
  URLs (watch, shorts, embed forms) into a `youtube-nocookie.com/embed` URL,
  stored directly as `videoUrl` — no file storage involved.
- `VideoAnnotator.tsx` branches on whether `videoUrl` is a YouTube embed:
  - File videos: native `<video>` + an absolutely-positioned `<canvas>` for
    freehand drawing, captured to a PNG data URL per annotation.
  - YouTube videos: the YouTube IFrame API drives playback/seek; annotations
    are note-only (no drawing surface).
  - In both cases, when annotations exist, video playback auto-pauses the
    moment it reaches a timestamp with an associated annotation.

## Key components (`src/components`)

`UploadForm`, `VideoAnnotator`, `CommentThread`, `EditableTitle`,
`ShareLink`, `CompleteReviewButton`, `DeleteSubmissionButton`,
`SubmissionList`, `SubmissionReview` (composes the annotator + comment
thread for the detail page), `Nav`, `SignOutButton`, `Providers`
(NextAuth `SessionProvider` wrapper).

## Known inconsistency

`Submission.movementType` exists in the schema but is always written as an
empty string by the create API — it's reserved for future use and not yet
surfaced anywhere in the UI.
