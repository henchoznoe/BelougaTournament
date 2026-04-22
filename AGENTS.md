# AGENTS.md

## Project Overview

Belouga Tournament — full-stack e-sports tournament management platform.
Next.js 16 (App Router, RSC, Server Actions, `cacheComponents`), React 19, TypeScript (strict), Prisma 7 (PostgreSQL, PrismaPg adapter), BetterAuth (Discord OAuth), Stripe (Checkout, Webhooks, Refunds), TailwindCSS v4, shadcn/ui. Hosted on Vercel. **UI text is in French; code and comments are in English.**

## Commands

| Command              | Purpose                                          |
|----------------------|--------------------------------------------------|
| `pnpm dev`           | Start dev server                                 |
| `pnpm build`         | Prisma generate + migrate + seed + Next.js build |
| `pnpm lint`          | Biome lint                                       |
| `pnpm format`        | Biome format (write)                             |
| `pnpm check`         | Biome check (lint + format, write)               |
| `pnpm test`          | Vitest run (all tests)                           |
| `pnpm test:coverage` | Vitest with v8 coverage                          |
| `pnpm knip`          | Detect dead/unused code                          |
| `npx tsc --noEmit`   | Type-check only                                  |
| `pnpm docker:up`     | Start local PostgreSQL                           |

```bash
# Run a single test file
pnpm vitest run tests/path/to/file.test.ts
# Run tests matching a name pattern
pnpm vitest run -t "test name pattern"
```

**CI** (`.github/workflows/ci.yml`): Node 22 + pnpm 10 → `tsc --noEmit` → `biome lint` → `biome format` → `vitest run`.
**Pre-commit**: Husky + lint-staged runs `biome check --write` on staged `*.{ts,tsx,css}`.

## Tests

Tests live in the top-level `tests/` directory (NOT colocated), organized by layer. Vitest `globals: true` (no need to import `describe`/`it`/`expect`). Environment: `node`.

```
tests/
├── utils/          # lib/utils/* helpers
├── validations/    # lib/validations/* Zod schemas
├── services/       # lib/services/* data-access functions
├── actions/        # lib/actions/* server actions
├── api/            # app/api/* route handlers
├── seo/            # robots.ts, sitemap.ts
└── proxy.test.ts   # Edge middleware guard
```

## Code Style

### Biome (NOT ESLint/Prettier)

Single quotes, semicolons as-needed, trailing commas all, arrow parens as-needed, 2-space indent, 120 char max line. `noExplicitAny: error`, `useNodejsImportProtocol: error`.

### File Headers

Every `.ts`/`.tsx` file starts with:

```ts
/**
 * File: <relative-path-from-root>
 * Description: <brief description>
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */
```

### Imports

External packages first, then internal `@/` imports. No blank lines between groups.

### Components

- **Arrow functions only**: `const MyComponent = () => { ... }`
- **Named exports** for feature/UI components; **default exports** only for pages/layouts (separate final line)
- `'use client'` / `'use server'` goes **after** the file header
- Props destructured in parameters; use `interface` for props, `type` for unions

### Naming

| Kind               | Convention       | Example                          |
|--------------------|------------------|----------------------------------|
| Files              | kebab-case       | `safe-action.ts`                 |
| Components         | PascalCase       | `PublicNavbar`                   |
| Variables/funcs    | camelCase        | `handleLogout`                   |
| Constants (objects)| UPPER_SNAKE_CASE | `ROUTES`, `CACHE_TAGS`           |
| Types/Interfaces   | PascalCase       | `AuthSession`, `ActionState`     |
| Prisma enums       | UPPER_SNAKE_CASE | `ADMIN`, `DRAFT`                 |

### Types & Validation

- Type definitions in `lib/types/`, Zod schemas in `lib/validations/`, Prisma types from `@/prisma/generated/prisma/`.
- **Zod v4** — uses `z.url()`, `z.uuid()`. Use `z.number()` + `register('field', { valueAsNumber: true })` for numeric fields (not `z.coerce.number()`).
- Env vars validated at startup via Zod (`lib/core/env.ts`); **never** access `process.env` directly.
- Use `as const` on constant objects.

### Prisma Enum Imports

**Never** use hardcoded string literals for Prisma enum values. Always import and use the enum objects from `@/prisma/generated/prisma/enums`.

Available enums: `Role`, `TournamentFormat`, `FieldType`, `TournamentStatus`, `RegistrationType`, `RefundPolicyType`, `RegistrationStatus`, `PaymentStatus`.

```ts
// GOOD — use enum imports everywhere
import { Role, TournamentStatus } from '@/prisma/generated/prisma/enums'

if (user.role === Role.ADMIN) { ... }
await prisma.tournament.findMany({ where: { status: TournamentStatus.PUBLISHED } })
<SelectItem value={TournamentStatus.DRAFT}>Brouillon</SelectItem>

// Record object keys use computed property syntax
const STATUS_STYLES: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'text-amber-400',
  [TournamentStatus.PUBLISHED]: 'text-emerald-400',
  [TournamentStatus.ARCHIVED]: 'text-zinc-400',
} as const

// BAD — never use string literals
if (user.role === 'ADMIN') { ... }
<SelectItem value="DRAFT">Brouillon</SelectItem>
```

**Import as values, not types.** Use `import { Role } from '...'`, not `import type { Role } from '...'`. Biome's `useImportType` rule may auto-add `type` if it detects type-only usage — ensure the import stays as a value import when the enum is used in comparisons, assignments, Record keys, or JSX attributes.

### Constants

All magic numbers and strings must be extracted to `lib/config/constants.ts`. Key exported constants:

| Constant | Purpose |
|---|---|
| `CACHE_TAGS` | Cache tag names for `cacheTag()` / `revalidateTag()` |
| `VALIDATION_LIMITS` | Shared min/max bounds used in Zod schemas and component attributes |
| `CENTIMES_PER_UNIT` | `100` — conversion factor between centimes and CHF |
| `ENTRY_FEE_MIN_AMOUNT` / `ENTRY_FEE_MAX_AMOUNT` | Entry fee bounds in centimes |
| `SECOND_IN_MS`, `MINUTE_IN_MS`, `DAY_IN_MS` | Time durations in milliseconds |
| `MINUTES_PER_HOUR` | `60` — for sub-day time formatting |
| `REGISTRATION_HOLD_MINUTES` | Stripe slot hold duration (exported from `lib/config/constants.ts`) |
| `TWITCH_FALLBACK_TIMEOUT_MS` | Offline fallback delay for the Twitch embed |
| `TOORNAMENT_ID_DISPLAY_LENGTH` | Characters shown for Toornament IDs in the admin UI |

### Money / Centimes

All monetary amounts are stored and passed in **centimes** (integers). Use the shared helpers:

```ts
import { formatCentimes, parseCentimes } from '@/lib/utils/formatting'

formatCentimes(5000)          // "50.00 CHF"
formatCentimes(5000, 'EUR')   // "50.00 EUR"
parseCentimes(50)             // 5000  (CHF input → centimes)
```

Never divide/multiply by a hardcoded `100` — use `CENTIMES_PER_UNIT` from constants if you need the raw factor.

### Error Handling

- **Server actions**: `authenticatedAction` wrapper (auth + role + Zod + Prisma error mapping + logger)
- **Services**: `try/catch` + `logger.error({ error }, 'message')` + fallback return
- **API routes**: `try/catch` + `logger.error({ error }, 'message')` + JSON error response
- **Client-side**: `try/catch` + `console.error()` + `toast.error()` (Sonner) — `logger` is `server-only`
- **Prisma errors**: `handlePrismaError()` from `lib/utils/prisma-error.ts`
- **Never** use bare `console.log/warn/error` in server-side runtime code — use `logger.*` instead

### Prisma `$queryRaw` Casts

`$queryRaw` returns `unknown[]`. All service files that use raw SQL include a file-level comment:

```ts
// $queryRaw returns `unknown[]`; casts below assert the shape matches our domain types
// because Prisma cannot infer types from raw SQL at compile time.
```

For casts on Prisma ORM queries (select subsets, nested includes), add an inline comment explaining why the cast is necessary.

### Styling

- TailwindCSS v4, CSS variables in `app/globals.css`
- `cn()` from `@/lib/utils/cn` (clsx + tailwind-merge) — **not** `@/lib/utils`
- shadcn/ui: new-york style, zinc base, lucide icons. Install: `pnpm dlx shadcn@latest add <name> -y`
- After install: fix import to `@/lib/utils/cn`, add file header, convert to arrow functions

## Project Structure

```
app/
├── (public)/             # Public pages (landing, tournaments, stream, leaderboard, profile, contact, legal)
│   ├── profile/loading.tsx         # Route-level skeleton for profile page
│   └── tournaments/[slug]/loading.tsx  # Route-level skeleton for tournament detail page
├── admin/                # Protected admin (AdminGuard + proxy.ts edge middleware)
│   └── loading.tsx       # Route-level skeleton for admin pages
├── api/admin/blobs/      # Vercel Blob upload/list/delete API
├── api/auth/[...all]/    # BetterAuth handler
├── api/webhook/          # Stripe webhook handler
├── login/                # Discord OAuth login
└── not-found.tsx         # 404 page

components/
├── admin/                # Admin domain components
│   ├── dashboard/        # Dashboard panels (stats, recent, payments)
│   ├── hooks/            # Shared admin hooks
│   │   ├── use-list-sort.ts          # Column sort state
│   │   ├── use-blob-list.ts          # Vercel Blob fetch + refresh
│   │   ├── use-logout.ts             # Shared logout logic (router + toast)
│   │   └── use-client-pagination.ts  # Client-side pagination
│   ├── tournaments/      # Tournament domain (detail, registrations, teams, list, dropdown, badge)
│   │   └── form/         # Tournament form tabs (general, game, dates, entry, content, fields, stages, images)
│   ├── users/            # User domain (detail, list, dropdown)
│   ├── sponsors/         # Sponsor domain (detail, form, list, dropdown)
│   ├── settings/         # Settings domain (settings-form, logo-picker)
│   └── ui/               # Admin shell (shell, sidebar, topbar, breadcrumb, content-layout, skeleton)
├── public/               # Public domain components
│   ├── auth/             # AdminGuard, LoginScreen, SocialLogin
│   ├── contact/          # ContactBento
│   ├── landing/          # Hero, features, sponsors, stream, tournaments sections
│   ├── layout/           # PublicNavbar, PublicFooter
│   ├── legal/            # LegalSection
│   ├── profile/          # ProfilePage, ProfileEditForm, ProfileRegistrations, RegistrationEditDialog
│   ├── stream/           # TwitchPlayer
│   └── tournaments/      # TournamentCard, TournamentDetail (RSC), TournamentHeroGallery (client island), TournamentRegistrationForm
└── ui/                   # shadcn/ui primitives + custom (markdown, page-header, role-badge, scroll-to-top)

lib/
├── actions/              # Server actions (authenticatedAction wrapper)
│   ├── safe-action.ts              # authenticatedAction pipeline
│   ├── tournaments.ts              # Tournament CRUD + status
│   ├── tournament-registration.ts  # Register, create/join team, update fields
│   ├── tournament-unregistration.ts# Unregister + refund logic
│   ├── tournament-team.ts          # Kick, dissolve team, update team name
│   ├── registrations.ts            # Admin registration management (delete, refund, update fields)
│   ├── registrations-team.ts       # Admin team management (change team, promote captain, update name, delete logo)
│   ├── users.ts                    # User promote/demote/update/ban/delete
│   ├── sponsors.ts                 # Sponsor CRUD + toggle status
│   ├── settings.ts                 # Global settings update
│   └── profile.ts                  # Own display name update
├── config/               # Routes, constants (CACHE_TAGS, METADATA), admin-nav
├── core/                 # Auth, Prisma client, env validation, logger, Stripe client
├── services/             # Data access with 'use cache' + cacheTag/cacheLife
│   ├── tournaments-admin.ts   # Admin tournament queries (list, detail, registrations, teams)
│   ├── tournaments-public.ts  # Public tournament queries (list, detail, hero badge, filters)
│   ├── tournaments-user.ts    # User registration state and profile history
│   ├── tournaments.ts         # Shared tournament queries (options list)
│   ├── dashboard.ts           # Admin dashboard stats and recent activity
│   ├── settings.ts            # Global settings singleton
│   ├── sponsors.ts            # Sponsor listing
│   ├── users.ts               # User profile and admin user management
│   └── auth.ts                # getSession() wrapper
├── types/                # TypeScript types (ActionState, AuthSession, domain types)
├── utils/                # Utility functions
│   ├── cn.ts                    # clsx + tailwind-merge
│   ├── formatting.ts            # formatDate, formatCentimes, parseCentimes, toNullable, stripHtml, …
│   ├── prisma-error.ts          # handlePrismaError() — maps Prisma codes to ActionState
│   ├── team.ts                  # syncTeamFullState, handleCaptainSuccession, removeUserFromTeam
│   ├── tournament-helpers.ts    # parseFieldValues, validateFieldValues, isRefundEligible
│   ├── tournament-status.ts     # getTournamentRegistrationBadge, extractTwitchChannel
│   ├── hero-tournament-badge.ts # resolveHeroTournamentBadge, getNextHeroTournamentBadgeUpdateDelay
│   ├── stripe-refund.ts         # issueStripeRefundAfterDbUpdate
│   ├── role.ts / owner.ts / verify-admin.ts  # Auth helpers
│   └── commit-hash.ts           # getCommitHash() for version display
└── validations/          # Zod v4 schemas (tournaments, settings, users, sponsors, profile, shared)
    # Note: VALID_SORT_OPTIONS exported from lib/validations/tournament-filters.ts

prisma/                   # Schema, migrations, seed, generated client (gitignored)
tests/                    # Unit tests (top-level, NOT colocated)
proxy.ts                  # Edge middleware for /admin/* route protection
```

## Key Patterns

### Server Actions

```ts
export const myAction = authenticatedAction({
  schema: myZodSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    await prisma.model.create({ data })
    revalidateTag(CACHE_TAGS.MY_TAG, 'hours') // 2nd arg must match cacheLife profile
    return { success: true, message: 'French message.' }
  },
})
```

### Cached Services

```ts
export const getData = async () => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.MY_TAG)
  // Prisma query with try/catch + logger.error({ error }, 'message')
}
```

Cache tags are centralized in `CACHE_TAGS` from `lib/config/constants.ts`. `revalidateTag(tag, profile)` requires **two arguments** — the profile must match the `cacheLife()` used in the service.

### Shared Admin Hooks

| Hook | Purpose |
|---|---|
| `useListSort(defaultKey, defaultDir)` | Column sort state for admin list tables |
| `useBlobList(folder)` | Fetch + refresh Vercel Blob list for a folder; returns `{ blobs, isLoadingBlobs, refetchBlobs }` |
| `useLogout(options?)` | Shared logout (BetterAuth signOut + toast + optional `onSuccess` callback) |
| `useClientPagination(items, pageSize)` | Client-side pagination with page state |

### Prerender Rules (`cacheComponents: true`)

1. **No `new Date()` in RSC** — compute in `'use cache'` services or pass from server to client
2. **Dynamic APIs** (`headers()`, `cookies()`) **require `<Suspense>`** wrapping the component that calls them
3. **Route-level `loading.tsx`** files act as automatic Suspense boundaries for the page component — prefer them over inline `<Suspense>` wrapping the entire page content
4. **Session in pages**: extract `getSession()` into a separate async wrapper component and wrap it in `<Suspense>`, or use a `loading.tsx` file

### Forms (Client Components)

`react-hook-form` + `zodResolver` + `useTransition` + server action + `toast.success()`/`toast.error()` (Sonner).

### Type Guards over Casts

Prefer runtime type guards over `as EnumType` casts for user-controlled values (select inputs, URL params):

```ts
const isStatus = (val: string): val is TournamentStatus =>
  Object.values(TournamentStatus).includes(val as TournamentStatus)
```

### Other

- **`server-only`** import in modules that must not be bundled client-side
- **Prisma singleton** with global caching in `lib/core/prisma.ts`
- **Auth**: BetterAuth + Discord OAuth → `getSession()` server-side only. Session data is passed to client components as props (`sessionUser`, `isAuthenticated`). `authClient.useSession()` is only used for the logout flow, not for reading session state in public components.
- **Admin protection**: dual-layer — edge `proxy.ts` + `AdminGuard` server component
- **Accessibility**: all icon-only buttons use `aria-label` (not `title`); all `<nav>` elements have `aria-label`; search inputs have `aria-label`
- **Vercel Blob**: images stored via `/api/admin/blobs` with folder prefix (`logos/`, `sponsors/`). Allowed types: PNG, JPEG, WebP (no SVG). Blob DELETE validates URL domain.
- **French strings with apostrophes**: use `\'` to escape apostrophes inside single-quoted string literals (e.g. `'L\'équipe'`). In JSX text content (between tags), write the apostrophe directly — no escaping needed. Never use `\u2019` or other Unicode escapes for apostrophes or accented characters; write them as literal UTF-8 characters.

When making function calls using tools that accept array or object parameters ensure those are structured using JSON. For example:
```json
[{"color": "orange", "options": {"option_key_1": true, "option_key_2": "value"}}, {"color": "purple", "options": {"option_key_1": true, "option_key_2": "value"}}]
```
