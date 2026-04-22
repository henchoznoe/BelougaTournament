# ARCHITECTURE.md

> High-level technical overview of the **Belouga Tournament** platform — a full-stack e-sports tournament management application.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, RSC, Server Actions, `cacheComponents`) | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript (strict) | 5.9 |
| ORM | Prisma (PostgreSQL, PrismaPg adapter) | 7.x |
| Auth | BetterAuth (Discord OAuth) | 1.4 |
| Payments | Stripe (Checkout, Webhooks, Refunds) | — |
| Validation | Zod v4 | 4.3 |
| Styling | TailwindCSS v4 + shadcn/ui (new-york, zinc) | 4.x |
| Forms | react-hook-form + @hookform/resolvers | 7.x |
| Linter/Formatter | Biome (replaces ESLint + Prettier) | 2.4 |
| Tests | Vitest + @vitest/coverage-v8 | 4.x |
| Hosting | Vercel (Analytics, SpeedInsights, Blob storage) | — |
| Database | PostgreSQL (local Docker, Supabase in prod) | 18 |
| Icons | Lucide React | — |
| Markdown | React Markdown | 10.x |
| Animations | Framer Motion | 12.x |

---

## Project Structure

```
.
├── app/                    # Next.js App Router — pages, layouts, API routes, SEO
│   ├── (public)/
│   │   ├── profile/loading.tsx          # Route-level skeleton for profile
│   │   └── tournaments/[slug]/loading.tsx  # Route-level skeleton for tournament detail
│   └── admin/loading.tsx                # Route-level skeleton for admin
├── components/
│   ├── admin/              # Admin domain components
│   │   ├── dashboard/      # Stats, recent logins, payments panels
│   │   ├── hooks/          # Shared admin hooks (useListSort, useBlobList, useLogout, useClientPagination)
│   │   ├── tournaments/    # Tournament list, detail, registrations, teams, form tabs
│   │   ├── users/          # User list, detail, dropdown
│   │   ├── sponsors/       # Sponsor list, form, detail
│   │   ├── settings/       # Settings form, logo picker
│   │   └── ui/             # Admin shell (sidebar, topbar, breadcrumb, skeleton)
│   ├── public/             # Public domain components (auth, contact, landing, layout, legal, profile, stream, tournaments)
│   └── ui/                 # shadcn/ui primitives + custom (markdown, page-header, role-badge, scroll-to-top)
├── lib/
│   ├── actions/            # Server actions (authenticatedAction wrapper)
│   ├── config/             # Routes, constants (CACHE_TAGS, VALIDATION_LIMITS, time helpers), admin nav
│   ├── core/               # Auth, Prisma client, env validation, structured logger, Stripe client
│   ├── services/           # Data access with 'use cache' + cacheTag + cacheLife
│   ├── types/              # TypeScript types (ActionState, AuthSession, domain types)
│   ├── utils/              # cn, formatting (formatCentimes/parseCentimes), prisma-error, auth helpers, team helpers, tournament-status
│   └── validations/        # Zod v4 schemas (VALID_SORT_OPTIONS exported from tournaments.ts)
├── prisma/                 # Schema, migrations, seed scripts, generated client (gitignored)
├── public/                 # Static assets (logo, backgrounds, fonts)
├── tests/                  # Unit tests organized by layer (NOT colocated)
├── proxy.ts                # Edge middleware — /admin/* route protection
├── next.config.ts          # CSP headers, cacheComponents, remote image patterns
├── biome.json              # Linter + formatter config
├── docker-compose.yml      # Local PostgreSQL
└── .github/workflows/      # CI pipeline
```

---

## Route Map

### Public Routes (`app/(public)/`)

Wrapped in `PublicNavbar` + `PublicFooter` layout.

| Route | Page |
|---|---|
| `/` | Landing page (hero, features, sponsors, stream, tournaments) |
| `/tournaments` | Published tournament list |
| `/tournaments/archive` | Archived tournament list |
| `/tournaments/:slug` | Tournament detail (info, stream embed, bracket, registration) |
| `/stream` | Twitch stream embed |
| `/leaderboard` | Leaderboard |
| `/profile` | User profile (active registrations, edit display name) |
| `/profile/tournaments` | Tournament history |
| `/contact` | Contact page |
| `/legal` | Legal notice |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/unauthorized` | Access denied page |

### Admin Routes (`app/admin/`)

Protected by edge middleware (`proxy.ts`) + `AdminGuard` server component. Wrapped in `AdminShell` (sidebar + topbar).

| Route | Page | Role |
|---|---|---|
| `/admin` | Dashboard (stats, upcoming tournaments, recent registrations, payments) | ADMIN+ |
| `/admin/tournaments` | Tournament list (CRUD, status management) | ADMIN+ |
| `/admin/tournaments/:slug` | Tournament detail / edit | ADMIN+ |
| `/admin/tournaments/:slug/registrations` | Manage registrations (delete, refund, update fields) | ADMIN+ |
| `/admin/tournaments/:slug/teams` | Manage teams (kick, dissolve, change, promote captain, rename) | ADMIN+ |
| `/admin/users` | User management (promote/demote, ban/unban, delete) | ADMIN |
| `/admin/users/:id` | User detail | ADMIN |
| `/admin/settings` | Global settings (logo, Twitch, socials, features) | ADMIN |
| `/admin/sponsors` | Sponsor list | ADMIN |
| `/admin/sponsors/new` | Create sponsor | ADMIN |
| `/admin/sponsors/:id` | Sponsor detail | ADMIN |
| `/admin/sponsors/:id/edit` | Edit sponsor | ADMIN |

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...all]` | GET, POST | BetterAuth catch-all handler (OAuth, session) |
| `/api/admin/blobs` | GET, POST, DELETE | Vercel Blob CRUD (ADMIN only) |
| `/api/webhook` | POST | Stripe webhook handler (payment events) |

### SEO

| File | Output |
|---|---|
| `app/robots.ts` | Dynamic `robots.txt` — disallows `/admin/`, `/login`, `/profile`, `/api/` |
| `app/sitemap.ts` | Dynamic sitemap — static routes + published/archived tournaments |

---

## Database Schema

### Enums

| Enum | Values |
|---|---|
| `Role` | `USER`, `ADMIN` |
| `TournamentFormat` | `SOLO`, `TEAM` |
| `FieldType` | `TEXT`, `NUMBER` |
| `TournamentStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `RegistrationType` | `FREE`, `PAID` |
| `RefundPolicyType` | `NONE`, `BEFORE_DEADLINE` |
| `RegistrationStatus` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `PaymentStatus` | `UNPAID`, `PAID`, `REFUNDED` |

All enum values are imported from `@/prisma/generated/prisma/enums` — **never** use string literals.

### Models & Relationships

```
User ──────┬── Session (1:N)
           ├── Account (1:N, OAuth providers)
           ├── TournamentRegistration (1:N)
           ├── Team (1:N, as captain)
           ├── TeamMember (1:N)

Tournament ┬── TournamentField (1:N, custom form fields)
           ├── Team (1:N)
           ├── TournamentRegistration (1:N)
           └── ToornamentStage (1:N)

Team ──────┬── TeamMember (1:N)
           └── TournamentRegistration (1:1, optional)

GlobalSettings   (singleton, id=1)
Sponsor          (standalone)
Verification     (standalone, BetterAuth internal)
```

**Key constraints:**
- `@@unique([name, tournamentId])` on `Team` — unique team name per tournament
- `@@unique([tournamentId, userId])` on `TournamentRegistration` — one registration per user per tournament
- All foreign keys use `onDelete: Cascade`

---

## Core Architectural Patterns

### 1. Server Actions via `authenticatedAction`

All mutations go through the `authenticatedAction` wrapper (`lib/actions/safe-action.ts`) which provides a standardized pipeline:

```
Client Component (form submit)
  └─> Server Action
       └─> authenticatedAction
            ├─ 1. Auth check (getSession via headers)
            ├─ 2. Role check (Role.ADMIN / array)
            ├─ 3. Zod validation (schema.safeParse)
            ├─ 4. Handler execution (business logic)
            ├─ 5. Error handling (Prisma error mapping + logger)
            └─> Returns ActionState<T> { success, message, errors?, data? }
```

### 2. Caching with `'use cache'`

Service functions use Next.js 16's caching directives for ISR-style data fetching:

```
Service Function
  ├─ 'use cache'                          // Opt into caching
  ├─ cacheLife('hours' | 'minutes')       // Cache duration profile
  ├─ cacheTag(CACHE_TAGS.XYZ)            // Tag for targeted invalidation
  └─ Prisma query

Server Action (after mutation)
  └─ revalidateTag(CACHE_TAGS.XYZ, 'hours')  // Must match cacheLife profile — two args required
```

Cache tags are centralized in `CACHE_TAGS` (`lib/config/constants.ts`): `dashboard-stats`, `dashboard-payments`, `dashboard-registrations`, `dashboard-recent-users`, `settings`, `sponsors`, `tournaments`, `users`.

### 3. Auth Flow (BetterAuth + Discord OAuth)

```
Browser                     Server                        Discord
  │                           │                              │
  ├─ Click "Se connecter" ──> │                              │
  │                           ├─ Initiate OAuth ───────────> │
  │  <── Redirect to Discord  │                              │
  │                           │                              │
  │  ── OAuth callback ─────> │                              │
  │                           ├─ Exchange code for token ──> │
  │                           │ <── User profile ────────────┤
  │                           ├─ Create/update User + Session│
  │                           ├─ databaseHook: sync Discord  │
  │                           │   name, image, discordId     │
  │  <── Set session cookie   │                              │
  │                           │                              │
  │  Subsequent requests:     │                              │
  │  ── Cookie ─────────────> │                              │
  │                           ├─ Server: getSession()        │
  │                           │   (session passed as props   │
  │                           │    to client components)     │
```

**Session config:** 7-day expiry, 24-hour update age, 5-minute cookie cache, 30 requests / 60 seconds rate limit.

### 4. Dual-Layer Admin Protection

```
Request to /admin/*
  │
  ├─ Layer 1 — Edge Middleware (proxy.ts)
  │   ├─ Fetches session via internal GET /api/auth/get-session
  │   ├─ Unauthenticated → redirect to /login
  │   └─ Not ADMIN → redirect to /unauthorized
  │
  └─ Layer 2 — Server Component (AdminGuard)
      ├─ Calls getSession() at component level
      ├─ Same auth + role checks as defense-in-depth
      └─ Renders AdminShell (sidebar + topbar) on success
```

### 5. Stripe Payment Flow

```
User clicks "S'inscrire" (paid tournament)
  │
  ├─ registerForTournament / createTeamAndRegister / joinTeamAndRegister (server action)
  │   ├─ Creates TournamentRegistration with status=PENDING, paymentStatus=UNPAID
  │   ├─ Holds slot for REGISTRATION_HOLD_MINUTES (30 min) via expiresAt timestamp
  │   └─ Creates Stripe Checkout Session → returns URL
  │
  ├─ User redirected to Stripe Checkout
  │
  ├─ Stripe webhook (/api/webhook) handles events:
  │   ├─ checkout.session.completed → status=CONFIRMED, paymentStatus=PAID
  │   └─ checkout.session.expired  → registration deleted, slot released
  │
  └─ Refund (unregister / admin action)
      ├─ DB update first (status=CANCELLED, paymentStatus=REFUNDED)
      └─ issueStripeRefundAfterDbUpdate() — Stripe refund issued after DB commit
```

**Constants:** `REGISTRATION_HOLD_MINUTES = 30` (exported from `lib/core/stripe.ts`).

### 6. RSC vs Client Component Boundary

| Server Components | Client Components (`'use client'`) |
|---|---|
| Pages, layouts | Interactive forms (react-hook-form) |
| `AdminGuard` (async, server-side redirect) | Dialogs (create, edit, delete, confirm) |
| `ProfilePage` (fetches data) | Lists with search/filter/status selectors |
| `TournamentDetail` (RSC orchestrator) | `TournamentHeroGallery` (image gallery client island) |
| Data fetching via services | Toast notifications (Sonner) |
| Session props passed to client components | `authClient.useSession()` only for logout flow |
| SEO files (robots, sitemap) | Framer Motion animations |

`cacheComponents: true` in `next.config.ts` enables component-level RSC caching. **No `new Date()` in RSC** — compute in `'use cache'` services or pass from server to client. Dynamic APIs (`headers()`, `cookies()`) require `<Suspense>` wrapping. Route-level `loading.tsx` files provide automatic Suspense boundaries for pages calling dynamic APIs like `getSession()`.

---

## Component Organization

```
components/
├── admin/
│   ├── dashboard/      # Dashboard panels (stats, recent logins, payments)
│   ├── hooks/          # Shared admin hooks
│   │   ├── use-list-sort.ts          # Column sort state for admin tables
│   │   ├── use-blob-list.ts          # Vercel Blob fetch + refresh (returns { blobs, isLoadingBlobs, refetchBlobs })
│   │   ├── use-logout.ts             # BetterAuth signOut + toast + optional onSuccess callback
│   │   └── use-client-pagination.ts  # Client-side pagination with page state
│   ├── tournaments/    # Tournament domain (detail, registrations, teams, list, dropdown, badge)
│   │   └── form/       # Form tabs (general, game, dates, entry, content, fields, stages, images)
│   ├── users/          # User domain (detail, list, dropdown)
│   ├── sponsors/       # Sponsor domain (detail, form, list, dropdown)
│   ├── settings/       # Settings domain (settings-form, logo-picker)
│   └── ui/             # Admin shell (shell, sidebar, topbar, breadcrumb, content-layout, skeleton)
├── public/
│   ├── auth/           # AdminGuard (RSC), LoginScreen, SocialLogin
│   ├── contact/        # ContactBento
│   ├── landing/        # Hero, features, sponsors, stream, tournaments sections
│   ├── layout/         # PublicNavbar (RSC), PublicNavbarClient, PublicFooter, BanBanner, NavbarProfile
│   ├── legal/          # LegalSection
│   ├── profile/        # ProfilePage (RSC), ProfileEditForm, ProfileRegistrations, RegistrationEditDialog
│   ├── stream/         # TwitchPlayer (with TWITCH_FALLBACK_TIMEOUT_MS offline detection)
│   └── tournaments/    # TournamentCard, TournamentDetail (RSC), TournamentHeroGallery (client island), TournamentRegistrationForm
└── ui/                 # shadcn/ui primitives + custom (markdown, page-header, role-badge, scroll-to-top)
```

---

## Data Access Layer

### Services (`lib/services/`)

| Service | Cache Profile | Tags | Key Queries |
|---|---|---|---|
| `tournaments-admin.ts` | `hours` | `TOURNAMENTS` | Admin list, by-slug detail, registrations, teams |
| `tournaments-public.ts` | `hours` | `TOURNAMENTS` | Public list, filtered/paginated list, detail, hero badge, available teams |
| `tournaments-user.ts` | `hours` | `TOURNAMENTS`, `USERS` | User registration state, profile history |
| `tournaments.ts` | `hours` | `TOURNAMENTS` | Shared options list (for selects) |
| `dashboard.ts` | `minutes` | `DASHBOARD_*` | Aggregate stats, recent logins, recent registrations, payments |
| `settings.ts` | `hours` | `SETTINGS` | Singleton global settings with fallback defaults |
| `users.ts` | `hours` | `USERS` | User profile, admin user management, active ban check |
| `sponsors.ts` | `hours` | `SPONSORS` | Sponsor listing |
| `auth.ts` | — | — | `getSession()` (no cache, reads from cookies) |

All service files using `$queryRaw` include a file-level comment explaining that casts to domain types are necessary because Prisma cannot infer types from raw SQL at compile time.

### Actions (`lib/actions/`)

| Action File | Operations |
|---|---|
| `safe-action.ts` | `authenticatedAction` pipeline |
| `tournaments.ts` | `createTournament`, `updateTournament`, `deleteTournament`, `updateTournamentStatus` |
| `tournament-registration.ts` | `registerForTournament`, `createTeamAndRegister`, `joinTeamAndRegister`, `updateRegistrationFields` |
| `tournament-unregistration.ts` | `unregisterFromTournament` (with Stripe refund logic) |
| `tournament-team.ts` | `kickPlayer`, `dissolveTeam`, `updateTeamName` |
| `registrations.ts` | `adminDeleteRegistration`, `adminRefundRegistration`, `adminUpdateRegistrationFields` |
| `registrations-team.ts` | `adminChangeTeam`, `adminPromoteCaptain`, `adminUpdateTeamName`, `adminDeleteTeamLogo` |
| `users.ts` | `promoteToAdmin`, `demoteAdmin`, `updateUser`, `deleteUser` |
| `sponsors.ts` | `createSponsor`, `updateSponsor`, `deleteSponsor`, `toggleSponsorStatus` |
| `settings.ts` | `updateSettings` |
| `profile.ts` | `updateProfile` |

---

## Validation Layer

All Zod v4 schemas live in `lib/validations/`. Key patterns:

- `z.url()`, `z.uuid()` for URL/UUID validation
- Numeric fields: `z.number()` + `register('field', { valueAsNumber: true })` — not `z.coerce.number()`
- Enum values: `z.enum([...])` via imports from `@/prisma/generated/prisma/enums`
- Bounds: all min/max from `VALIDATION_LIMITS` in `lib/config/constants.ts`
- `VALID_SORT_OPTIONS` (tournament sort options array) exported from `lib/validations/tournaments.ts`

---

## Constants Reference (`lib/config/constants.ts`)

| Constant | Value | Purpose |
|---|---|---|
| `CENTIMES_PER_UNIT` | `100` | CHF ↔ centimes conversion factor |
| `ENTRY_FEE_MIN_AMOUNT` | `100` (1 CHF) | Minimum paid entry fee in centimes |
| `ENTRY_FEE_MAX_AMOUNT` | `100_000` (1000 CHF) | Maximum paid entry fee in centimes |
| `SECOND_IN_MS` | `1000` | One second in milliseconds |
| `MINUTE_IN_MS` | `60_000` | One minute in milliseconds |
| `DAY_IN_MS` | `86_400_000` | One day in milliseconds |
| `MINUTES_PER_HOUR` | `60` | Sub-day time formatting |
| `TWITCH_FALLBACK_TIMEOUT_MS` | `8000` | Twitch offline fallback delay |
| `TOORNAMENT_ID_DISPLAY_LENGTH` | `12` | Truncation length for Toornament IDs in admin UI |
| `REGISTRATION_HOLD_MINUTES` | `30` | Stripe slot hold duration (in `lib/config/constants.ts`) |
| `CACHE_TAGS` | object | Tag names for `cacheTag()` / `revalidateTag()` |
| `VALIDATION_LIMITS` | object | All shared min/max bounds for Zod + HTML inputs |
| `TOURNAMENT_STATUS_LABELS` | object | French labels per `TournamentStatus` |
| `TOURNAMENT_STATUS_STYLES` | object | Tailwind classes per `TournamentStatus` |

### Money / Centimes

```ts
import { formatCentimes, parseCentimes } from '@/lib/utils/formatting'

formatCentimes(5000)          // "50.00 CHF"
formatCentimes(5000, 'EUR')   // "50.00 EUR"
parseCentimes(50)             // 5000  (CHF input → centimes)
```

Never divide/multiply by `100` directly — use `CENTIMES_PER_UNIT`.

---

## Error Handling Strategy

| Layer | Pattern |
|---|---|
| **Server actions** | `authenticatedAction` wraps all mutations — auth, role, Zod, Prisma error mapping, logger |
| **Services** | `try/catch` + `logger.error({ error }, 'message')` + fallback return |
| **API routes** | `try/catch` + `logger.error({ error }, 'message')` + JSON error response |
| **Client-side** | `try/catch` + `console.error()` + `toast.error()` (Sonner) |
| **Prisma errors** | `handlePrismaError()` maps P2000/P2002/P2003/P2025 to user-friendly `ActionState` |
| **Error boundaries** | `app/error.tsx`, `app/global-error.tsx`, `app/(public)/error.tsx`, `app/admin/error.tsx` |

---

## Image Storage (Vercel Blob)

- REST API at `/api/admin/blobs` (not server actions — requires FormData multipart)
- **Folder prefixes:** `logos/`, `sponsors/`
- **Allowed types:** PNG, JPEG, WebP (no SVG)
- **Max size:** 5 MB (admin uploads), 2 MB (team logos)
- **Access:** ADMIN only
- **Security:** DELETE validates URL domain (`*.public.blob.vercel-storage.com`)
- **Next.js:** Remote image patterns configured in `next.config.ts`
- **Hook:** `useBlobList(folder)` in `components/admin/hooks/use-blob-list.ts` provides `{ blobs, isLoadingBlobs, refetchBlobs }` — used by `tournament-form-images.tsx`, `sponsor-form.tsx`, `logo-picker.tsx`

---

## Testing

Tests live in `tests/` (top-level, NOT colocated), organized by layer:

```
tests/
├── utils/          # Pure utility functions (cn, formatting, prisma-error, auth helpers, commit-hash)
├── validations/    # Zod schema validation (tournaments, settings, users, sponsors, profile, shared)
├── services/       # Data access mocking (tournaments, dashboard, users, sponsors, auth)
├── actions/        # Server action testing (tournaments, registrations, team, users, sponsors, settings, profile, safe-action)
├── api/            # API route handlers (blobs)
├── seo/            # SEO files (robots.ts, sitemap.ts)
└── proxy.test.ts   # Edge middleware guard
```

**Config:** Vitest with `globals: true` (no imports for `describe`/`it`/`expect`), `node` environment, v8 coverage, `@/` path alias. **494 tests across 37 files.**

---

## CI/CD Pipeline

**CI** (`.github/workflows/ci.yml`): Triggers on push/PR to `main` or `develop`.

```
Node 22 + pnpm 10
  ├─ Install dependencies
  ├─ tsc --noEmit          # Type checking
  ├─ biome lint            # Lint
  ├─ biome format          # Format check
  └─ vitest run            # Tests (NODE_ENV=test)
```

**Pre-commit** (Husky + lint-staged): `biome check --write` on staged `*.{ts,tsx,css}`.

**Deployment:** Vercel (auto-deploy from Git). Build command: `prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build`.

---

## Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NODE_ENV` | Server | Runtime environment |
| `BETTER_AUTH_SECRET` | Server | Auth encryption secret (min 32 chars) |
| `BETTER_AUTH_URL` | Server | Auth base URL |
| `DISCORD_CLIENT_ID` | Server | Discord OAuth app ID |
| `DISCORD_CLIENT_SECRET` | Server | Discord OAuth secret |
| `DATABASE_URL` | Server | Pooled PostgreSQL connection (PrismaClient) |
| `DIRECT_URL` | Server | Direct PostgreSQL connection (Prisma CLI migrations) |
| `BLOB_READ_WRITE_TOKEN` | Server | Vercel Blob storage token |
| `STRIPE_SECRET_KEY` | Server | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe webhook signing secret |
| `ADMIN_EMAILS` | Server | Comma-separated emails for seed admin promotion |
| `NEXT_PUBLIC_APP_URL` | Client | Public-facing app URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key |
| `VERCEL_ENV` | Server (optional) | Vercel runtime environment |
| `VERCEL_GIT_COMMIT_SHA` | Server (optional) | Git commit SHA for version display |

All validated at startup via Zod (`lib/core/env.ts`). Application crashes on invalid config (except in test).
