# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BelougaTournament is a tournament management platform built as a single Next.js 16 app (App Router, React 19, TypeScript strict mode). PostgreSQL via Prisma 7, Better Auth with Discord OAuth, Stripe payments, Vercel Blob storage.

UI text is French. Code, comments, and identifiers are English.

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # prisma generate -> migrate deploy -> seed -> next build (touches DB!)
pnpm test                   # Vitest once
pnpm test:coverage          # Vitest with coverage (CI uses this)
pnpm vitest run tests/path/to/file.test.ts  # Single test file
pnpm vitest run -t "name"   # Tests matching pattern
pnpm exec tsc --noEmit      # Type-check
pnpm exec biome check .     # Lint/format check (matches CI)
pnpm check                  # Biome check --write
pnpm check:all              # Biome + knip (dead code)
pnpm check:com              # Biome + knip + vitest + tsc + next build (full local verification)
pnpm generate               # Generate Prisma client
pnpm migrate                # Local prisma migrate dev (schema changes)
pnpm db:deploy              # generate + migrate deploy + seed (no next build)
pnpm db:reset               # Reset database with --force
pnpm db:studio              # Prisma Studio
pnpm docker:up              # Start PostgreSQL 18-alpine on localhost:5432
pnpm docker:down            # Stop PostgreSQL container
pnpm stripe:listen          # Stripe webhook forwarding to localhost:3000/api/webhook
```

### CI Pipeline

CI order: `tsc --noEmit` -> `biome check .` -> `test:coverage`. Pre-commit hook only runs `biome check --write` on staged `*.{ts,tsx,css}` — does not type-check or test.

## Architecture

### Boundaries

- `app/` — Routes and page orchestration. Route groups: `(public)/`, `admin/`, `api/`
- `components/` — UI split by domain: `public/`, `admin/`, `ui/` (shadcn primitives)
- `lib/actions/` — Server Actions for mutations via `authenticatedAction()` wrapper
- `lib/services/` — Read-side cached data access (server-only, `'use cache'`, `cacheTag()`, `cacheLife()`)
- `lib/core/` — Auth, env, logger, Prisma client, Stripe client
- `lib/validations/` — Zod v4 schemas
- `lib/config/constants/` — Named constants (new constants go here, not the barrel at `lib/config/constants`)
- `lib/utils/` — Helpers (formatting, cn, stripe-refund, etc.)
- `prisma/` — Schema, migrations, seed, generated client at `prisma/generated/prisma`
- `tests/` — Top-level Vitest suites mirroring source structure (not colocated)
- `proxy.ts` — Edge middleware for admin route protection

### Data Access Pattern

**Reads:** `lib/services/*` — server-only, cached with `'use cache'` + `cacheTag()` + `cacheLife()`, `try/catch` with safe fallbacks, `logger.error()`.

**Writes:** `lib/actions/*` — use `authenticatedAction()` from `lib/actions/safe-action.ts` which centralizes auth, role checks, Zod validation, logging, and Prisma error mapping. Invalidate cache via `revalidateTag()`.

### Auth & Admin Protection

- Session reads: `getSession()` from `lib/services/auth.ts`. Pass session-derived data as props instead of re-reading in client components.
- Admin protection is dual-layer: `proxy.ts` (edge) + `AdminGuard` component (app layer).
- `proxy.ts` cannot import `lib/core/env.ts` (Node.js only). Direct `process.env` access is the justified exception there.

### Caching

`next.config.ts` enables `cacheComponents`. Follow existing pattern of route `loading.tsx` files or `<Suspense>` around dynamic APIs (`headers()`, `cookies()`).

### Payments

Paid registrations: create pending -> redirect to Stripe Checkout -> webhook confirms/expires/fails -> cache invalidation. Money stored in centimes — use `lib/utils/formatting.ts` helpers and `CENTIMES_PER_UNIT`, never raw `/ 100` or `* 100`. Refunds are DB-first, then reconciled with Stripe via `lib/utils/stripe-refund.ts`.

## Repo Conventions

- Every `.ts`/`.tsx` file starts with the repository header block (File, Description, Author, License, Copyright).
- Prisma client generated to `prisma/generated/prisma`. Import enums from `@/prisma/generated/prisma/enums` — never hardcode enum strings.
- Runtime env access through `lib/core/env.ts` (exceptions: `proxy.ts`, Prisma config/seed).
- Prisma CLI reads `.env.local` via `prisma.config.ts`.
- Biome for lint/format (not ESLint/Prettier). `noExplicitAny: error`.
- `cn()` from `@/lib/utils/cn`, not `@/lib/utils`.
- Numeric form inputs: `z.number()` + React Hook Form `{ valueAsNumber: true }`. No `z.coerce.number()` in repo.
- Validation bounds shared in `lib/config/constants/validation.ts`.
- Behavior changes must ship with tests.

## Gotchas

- `ADMIN_EMAILS` seeds admin users at build time (`prisma/seed-admin.ts`). `OWNER_EMAILS` is runtime authorization for owner-only actions. They are NOT interchangeable.
- `pnpm build` and `pnpm db:deploy` both touch the target database and run seed logic. Double-check which `.env.local` DB you're pointing at before running.
- Do NOT run `prisma migrate dev` against remote environments. Use `pnpm migrate` locally, commit the migration, then `pnpm db:deploy` for deploy.
