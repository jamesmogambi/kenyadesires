# AGENTS.md

Reference for agents working in the `kenyadesires` repo.

## Commands

| Purpose          | Command                          |
|------------------|----------------------------------|
| Dev server       | `npm run dev`                    |
| Lint             | `npm run lint` (i.e. `next lint`) |
| Typecheck        | `npx tsc --noEmit`               |
| Build            | `npm run build`                  |
| Run migrations   | `npm run migrate`                |

## Conventions

- **Framework:** Next.js 15 App Router + TypeScript (Next 16 runtime).
- **Auth:** Clerk. Server-side `import { auth } from "@clerk/nextjs/server"` then
  `const { userId } = await auth();`.
- **DB:** MySQL via `mysql2/promise` (`lib/db.ts`). Query helper
  `executeQuery` / `executeTransaction` live in `lib/neon.ts` and accept
  Postgres-style `$1/$2` placeholders (auto-converted to `?`).
- **API routes:** `app/api/**/route.ts` exporting `GET`/`POST` (etc.) handlers
  receiving `(req: NextRequest | Request)`. Call `await connection()` first to
  prevent static generation where the route touches the DB.
- **Styling:** Tailwind + Radix UI. Shared `cn(...)` from `lib/utils.ts`. The
  brand palette is red (`red-700`) on `stone-100`/white.
- **Validation:** manual (see `app/api/mpesa/stk-push/route.ts`); `zod` is
  available in deps but not used in route handlers today.
- **Env:** `.env*` is gitignored. `.env.example` is the committed template.
