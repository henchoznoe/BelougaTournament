# ARCHITECTURE.md

> High-level technical overview of the **Belouga Tournament** platform — a full-stack e-sports tournament management application.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, RSC, Server Actions) | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript (strict) | 5.9 |
| ORM | Prisma (PostgreSQL, PrismaPg adapter) | 7.x |
| Auth | BetterAuth (Discord OAuth) | 1.4 |
| Validation | Zod v4 | 4.3 |
| Styling | TailwindCSS v4 + shadcn/ui (new-york, zinc) | 4.2 |
| Forms | react-hook-form + @hookform/resolvers | 7.x |
| Linter/Formatter | Biome (replaces ESLint + Prettier) | 2.4 |
| Tests | Vitest + @vitest/coverage-v8 | 4.x |
| Hosting | Vercel (Analytics, SpeedInsights, Blob storage) | — |
| Database | PostgreSQL 18 (local Docker, Vercel Postgres in prod) | 18 |
| Icons | Lucide React + Font Awesome (brand icons) | — |
| Animations | Framer Motion | 12.x |

---

## Project Structure

```
.
├── app/                    # Next.js App Router — pages, layouts, API routes, SEO
├── components/
│   ├── features/           # Domain components (admin, auth, landing, layout, profile, tournaments, ...)
│   └── ui/                 # shadcn/ui primitives (button, dialog, input, table, tabs, ...)
├── lib/
│   ├── actions/            # Server actions (authenticatedAction wrapper)
│   ├── config/             # Routes, constants (CACHE_TAGS, METADATA), admin sidebar nav
│   ├── core/               # Auth, Prisma client, env validation, structured logger
│   ├── hooks/              # Custom React hooks (reserved)
│   ├── services/           # Data access with 'use cache' + cacheTag + cacheLife
│   ├── types/              # TypeScript types (ActionState, AuthSession, domain types)
│   ├── utils/              # cn, formatting, prisma-error, auth helpers, toNullable
│   └── validations/        # Zod v4 schemas
├── prisma/                 # Schema, migrations, seed scripts, generated client (gitignored)
├── public/                 # Static assets (logo, backgrounds, fonts)
├── tests/                  # Unit tests organized by layer (NOT colocated)
├── proxy.ts                # Edge middleware — /admin/* route protection
├── next.config.ts          # CSP headers, cacheComponents, remote image patterns
├── biome.json              # Linter + formatter config
├── docker-compose.yml      # Local PostgreSQL 18-alpine
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
| `/classement` | Leaderboard |
| `/profil` | User profile (registrations, history, edit display name) |
| `/contact` | Contact page |
| `/legal` | Legal notice |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/unauthorized` | Access denied page |

### Admin Routes (`app/admin/`)

Protected by edge middleware (`proxy.ts`) + `AdminGuard` server component. Wrapped in `AdminShell` (sidebar + topbar).

| Route | Page | Role |
|---|---|---|
| `/admin` | Dashboard (stats, upcoming tournaments, recent registrations) | ADMIN+ |
| `/admin/tournaments` | Tournament list (CRUD, status management) | ADMIN+ |
| `/admin/tournaments/new` | Create tournament | ADMIN+ |
| `/admin/tournaments/:slug` | Edit tournament (tabbed: general, registrations, teams) | ADMIN+ |
| `/admin/tournaments/:slug/registrations` | Manage registrations (approve/reject) | ADMIN+ |
| `/admin/tournaments/:slug/teams` | Manage teams (dissolve, kick) | ADMIN+ |
| `/admin/players` | Player management (edit, ban/unban) | ADMIN+ |
| `/admin/admins` | Admin management (promote/demote, tournament assignments) | SUPERADMIN |
| `/admin/settings` | Global settings (logo, Twitch, socials, features) | SUPERADMIN |
| `/admin/sponsors` | Sponsor management (CRUD, image upload) | SUPERADMIN |

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...all]` | GET, POST | BetterAuth catch-all handler (OAuth, session) |
| `/api/admin/blobs` | GET, POST, DELETE | Vercel Blob CRUD (SUPERADMIN only) |
| `/api/admin/tournaments/:id/export-csv` | GET | CSV export of tournament registrations (ADMIN+) |

### SEO

| File | Output |
|---|---|
| `app/robots.ts` | Dynamic `robots.txt` — disallows `/admin/`, `/login`, `/profil`, `/api/` |
| `app/sitemap.ts` | Dynamic sitemap — static routes + published/archived tournaments |

---

## Database Schema

### Enums

| Enum | Values |
|---|---|
| `Role` | `USER`, `ADMIN`, `SUPERADMIN` |
| `TournamentFormat` | `SOLO`, `TEAM` |
| `FieldType` | `TEXT`, `NUMBER` |
| `RegistrationStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `TournamentStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |

### Models & Relationships

```
User ──────┬── Session (1:N)
           ├── Account (1:N, OAuth providers)
           ├── TournamentRegistration (1:N)
           ├── Team (1:N, as captain)
           ├── TeamMember (1:N)
           └── AdminAssignment (1:N)

Tournament ┬── TournamentField (1:N, custom form fields)
           ├── Team (1:N)
           ├── TournamentRegistration (1:N)
           └── AdminAssignment (1:N)

Team ──────┬── TeamMember (1:N)
           └── TournamentRegistration (1:1, optional)

GlobalSettings   (singleton, id=1)
Sponsor          (standalone)
Verification     (standalone, BetterAuth internal)
```

**Key constraints:**
- `@@unique([name, tournamentId])` on `Team` — unique team name per tournament
- `@@unique([tournamentId, userId])` on `TournamentRegistration` — one registration per user per tournament
- `@@unique([adminId, tournamentId])` on `AdminAssignment`
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
            ├─ 2. Role check (ADMIN / SUPERADMIN / array)
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
  └─ revalidateTag(CACHE_TAGS.XYZ, 'hours')  // Must match cacheLife profile
```

Cache tags are centralized in `CACHE_TAGS` (`lib/config/constants.ts`): `admins`, `dashboard-stats`, `dashboard-upcoming`, `dashboard-registrations`, `players`, `settings`, `sponsors`, `tournaments`, `tournament-options`.

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
  │                           ├─ Client: authClient.useSession()
```

**Session config:** 7-day expiry, 24-hour update age, 5-minute cookie cache, 30 requests / 60 seconds rate limit.

### 4. Dual-Layer Admin Protection

```
Request to /admin/*
  │
  ├─ Layer 1 — Edge Middleware (proxy.ts)
  │   ├─ Fetches session via internal GET /api/auth/get-session
  │   ├─ Unauthenticated → redirect to /login
  │   └─ Not ADMIN/SUPERADMIN → redirect to /unauthorized
  │
  └─ Layer 2 — Server Component (AdminGuard)
      ├─ Calls getSession() at component level
      ├─ Same auth + role checks as defense-in-depth
      └─ Renders AdminShell (sidebar + topbar) on success
```

### 5. RSC vs Client Component Boundary

| Server Components | Client Components (`'use client'`) |
|---|---|
| Pages, layouts | Interactive forms (react-hook-form) |
| `AdminGuard` (async, server-side redirect) | Dialogs (create, edit, delete, confirm) |
| `ProfilePage` (fetches data) | Lists with search/filter/status selectors |
| Data fetching via services | `authClient.useSession()` for client-side session |
| SEO files (robots, sitemap) | Toast notifications (Sonner) |

`cacheComponents: true` in `next.config.ts` enables component-level RSC caching. This means **no `new Date()` in components** — use constants or compute at build time. Dynamic APIs (`headers()`, `cookies()`) require `<Suspense>` wrapping.

---

## Component Organization

```
components/
├── features/
│   ├── admin/          # 26 components — dashboard panels, tournament/player/admin/sponsor management
│   ├── auth/           # AdminGuard (RSC), LoginScreen, SocialLogin
│   ├── landing/        # Hero, features, sponsors, stream, tournaments sections
│   ├── layout/         # PublicNavbar, PublicFooter
│   ├── profile/        # ProfilePage (RSC), ProfileEditForm, ProfileRegistrations, RegistrationEditDialog
│   ├── tournaments/    # TournamentCard, TournamentDetail, TournamentRegistrationForm
│   ├── contact/        # ContactBento
│   ├── legal/          # LegalSection
│   └── stream/         # TwitchPlayer
└── ui/                 # 18 shadcn/ui primitives (new-york style, zinc base, lucide icons)
```

---

## Data Access Layer

### Services (`lib/services/`)

| Service | Cache Profile | Tags | Key Queries |
|---|---|---|---|
| `tournaments.ts` | `hours` | `TOURNAMENTS` | Admin list, by-slug detail, public lists, registrations, teams, user registrations |
| `dashboard.ts` | `minutes` | `DASHBOARD_*` | Aggregate stats, upcoming tournaments, recent registrations |
| `settings.ts` | `hours` | `SETTINGS` | Singleton global settings with fallback defaults |
| `admins.ts` | `hours` | `ADMINS` | Admin user listing with tournament assignments |
| `players.ts` | `hours` | `PLAYERS` | Player listing for admin management |
| `sponsors.ts` | `hours` | `SPONSORS` | Sponsor listing |
| `auth.ts` | — | — | `getSession()` (no cache, reads from cookies) |
| `users.ts` | `hours` | — | User profile queries |

### Actions (`lib/actions/`)

| Action File | Operations |
|---|---|
| `tournaments.ts` | Create, update, delete tournament; update status; register/unregister; manage registrations; create/join/dissolve team; kick player; update fields |
| `admins.ts` | Promote, demote, update admin (display name + tournament assignments) |
| `players.ts` | Update display name, ban/unban |
| `sponsors.ts` | Create, update, delete sponsor |
| `settings.ts` | Update global settings |
| `profile.ts` | Update own display name |

---

## Validation Layer

All Zod v4 schemas live in `lib/validations/`. Each action file references its corresponding schema. Key patterns:

- `z.url()`, `z.uuid()` for URL/UUID validation
- Numeric fields: `z.number()` + `register('field', { valueAsNumber: true })`
- Enum values used in `z.enum([...])` via imports from `@/prisma/generated/prisma/enums`

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
- **Max size:** 5 MB
- **Access:** SUPERADMIN only
- **Security:** DELETE validates URL domain (`*.public.blob.vercel-storage.com`)
- **Next.js:** Remote image patterns configured in `next.config.ts`

---

## Testing

Tests live in `tests/` (top-level, NOT colocated), organized by layer:

```
tests/
├── utils/          # Pure utility functions (cn, formatting, prisma-error, auth helpers, commit-hash)
├── validations/    # Zod schema validation (tournaments, settings, admins, players, sponsors, profile)
├── services/       # Data access mocking (tournaments, dashboard, admins, players, auth)
├── actions/        # Server action testing (tournaments, admins, players, sponsors, settings, profile, safe-action)
├── api/            # API route handlers (blobs, export-csv)
├── seo/            # SEO files (robots.ts, sitemap.ts)
└── proxy.test.ts   # Edge middleware guard
```

**Config:** Vitest with `globals: true` (no imports for `describe`/`it`/`expect`), `node` environment, v8 coverage, `@/` path alias.

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

**Deployment:** Vercel (auto-deploy from Git). Build command: `prisma generate && prisma migrate deploy && prisma db seed && next build`.

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
| `SUPERADMIN_EMAILS` | Server | Comma-separated emails for seed admin promotion |
| `NEXT_PUBLIC_APP_URL` | Client | Public-facing app URL |
| `VERCEL_ENV` | Server (optional) | Vercel runtime environment |
| `VERCEL_GIT_COMMIT_SHA` | Server (optional) | Git commit SHA for version display |

All validated at startup via Zod (`lib/core/env.ts`). Application crashes on invalid config (except in test).
