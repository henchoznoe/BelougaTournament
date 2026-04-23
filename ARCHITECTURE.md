# ARCHITECTURE.md

High-level technical reference for the current **Belouga Tournament** application.

## 1. System Overview

Belouga Tournament is a single Next.js 16 application serving:

- a public tournament platform,
- a protected admin back office,
- authentication endpoints,
- Stripe webhook processing,
- and Vercel Blob-backed media APIs.

The architecture follows a clear split:

- `app/` owns routes and page orchestration,
- `components/` owns UI,
- `lib/services/` owns read-side data access,
- `lib/actions/` owns write-side mutations,
- `prisma/` owns schema, migrations, and seeding.

## 2. Runtime Stack

| Layer | Technology |
| --- | --- |
| App framework | Next.js 16 App Router |
| Rendering | React 19, RSC, Server Actions |
| Caching | `cacheComponents`, `'use cache'`, `cacheLife`, `cacheTag` |
| Database | PostgreSQL |
| ORM | Prisma 7 + PrismaPg adapter |
| Auth | Better Auth + Discord OAuth |
| Payments | Stripe Checkout + webhooks + refunds |
| Storage | Vercel Blob |
| Validation | Zod v4 |
| Forms | react-hook-form |
| Styling | TailwindCSS v4 + shadcn/ui |
| Tooling | Biome, Vitest, Husky, lint-staged |

## 3. Top-Level Structure

```bash
.
├── app/
│   ├── (public)/         # Public routes
│   ├── admin/            # Admin routes
│   └── api/              # Auth, Stripe, Blob APIs
├── components/
│   ├── public/           # Public-facing UI
│   ├── admin/            # Admin UI
│   └── ui/               # Shared primitives
├── lib/
│   ├── actions/          # Server mutations
│   ├── services/         # Read-side data access
│   ├── core/             # Auth, env, logger, Prisma, Stripe
│   ├── config/           # Routes and constants
│   ├── validations/      # Zod schemas
│   ├── utils/            # Shared domain helpers
│   └── types/            # Shared TS types
├── prisma/               # Schema, migrations, seed, generated client
├── public/               # Static assets and fonts
├── tests/                # Vitest suites
├── proxy.ts              # Edge protection for /admin/*
└── next.config.ts        # Security headers, cacheComponents, image config
```

## 4. Route Architecture

### Public routes

`app/(public)/` contains the public experience:

- `/` landing page
- `/tournaments` published tournaments with filters and pagination
- `/tournaments/archive` archived tournaments
- `/tournaments/[slug]` tournament detail and registration flow
- `/profile` authenticated player profile
- `/stream` live Twitch page
- `/leaderboard` placeholder page for a future feature
- `/contact`, `/legal`, `/privacy`, `/terms`, `/login`, `/unauthorized`

The public layout is wrapped by `app/(public)/layout.tsx` and uses public-facing components under `components/public/`.

### Admin routes

`app/admin/` contains the back office:

- `/admin` dashboard
- `/admin/tournaments`
- `/admin/tournaments/new`
- `/admin/tournaments/[slug]`
- `/admin/tournaments/[slug]/edit`
- `/admin/users`
- `/admin/users/[id]`
- `/admin/sponsors`
- `/admin/sponsors/new`
- `/admin/sponsors/[id]`
- `/admin/sponsors/[id]/edit`
- `/admin/settings`

All admin pages share `app/admin/layout.tsx`, which renders `AdminShell` inside `AdminGuard` and a Suspense boundary.

### API routes

`app/api/` currently exposes:

- `/api/auth/[...all]` Better Auth handler
- `/api/webhook` Stripe webhook endpoint
- `/api/admin/blobs` admin-only media CRUD
- `/api/blobs/team-logo` authenticated team-logo upload/delete flow for captains

## 5. Rendering Model

The app uses React Server Components by default.

Common pattern:

1. route/page loads data through `lib/services/*`
2. server component composes data-rich UI
3. small client islands handle forms, dialogs, toasts, and local interactivity

Important runtime constraint:

- `next.config.ts` enables `cacheComponents`, so dynamic APIs such as `headers()` and `cookies()` must stay behind `Suspense` or route-level `loading.tsx` boundaries.

Existing route-level loading boundaries:

- `app/admin/loading.tsx`
- `app/(public)/profile/loading.tsx`
- `app/(public)/tournaments/[slug]/loading.tsx`

## 6. Data Access Split

### Read side: `lib/services/`

The service layer is the canonical place for reading application data.

Current service modules:

- `auth.ts`
- `dashboard.ts`
- `settings.ts`
- `sponsors.ts`
- `tournaments-admin.ts`
- `tournaments-public.ts`
- `tournaments-user.ts`
- `users.ts`

Most services are:

- `server-only`,
- wrapped in `'use cache'`,
- tagged with `cacheTag(...)`,
- profiled with `cacheLife(...)`,
- protected with `try/catch` and `logger.error(...)` plus safe fallbacks.

### Write side: `lib/actions/`

The action layer owns mutations and business workflows.

Important modules:

- `safe-action.ts` standardized authenticated mutation wrapper
- `tournaments.ts` tournament CRUD and publication state
- `tournament-registration.ts` registration entrypoints
- `tournament-registration-solo.ts` solo-specific flow
- `tournament-registration-team.ts` team-specific flow
- `tournament-unregistration.ts` player unregistration flow
- `tournament-team.ts` player team operations
- `registrations.ts` admin registration operations
- `registrations-team.ts` admin team operations
- `users.ts` admin user operations
- `sponsors.ts` sponsor CRUD
- `settings.ts` global settings updates
- `profile.ts` player profile updates

## 7. Mutation Pipeline

Server mutations are standardized through `authenticatedAction` in `lib/actions/safe-action.ts`.

Pipeline:

1. read current session from Better Auth using request headers
2. enforce optional role requirements
3. validate input with Zod
4. run business handler
5. map Prisma errors and log unexpected failures
6. return a typed `ActionState`

This pattern keeps auth, validation, and error handling consistent across the codebase.

## 8. Authentication and Authorization

### Authentication

The app uses Better Auth with Discord as the social provider.

Main behavior:

- sessions are stored in PostgreSQL,
- cookies are configured through Better Auth,
- Discord login synchronizes avatar, name, and immutable `discordId`,
- `getSession()` in `lib/services/auth.ts` is the standard server-side session accessor.

### Authorization

Admin protection is intentionally duplicated:

1. `proxy.ts` blocks unauthorized `/admin/*` requests at the edge.
2. `components/public/auth/admin-guard.tsx` re-checks access in the app layer.

This prevents accidental exposure from layout or routing mistakes.

`verifyAdmin()` is used by admin-only API routes such as `/api/admin/blobs`.

## 9. Caching Strategy

Caching is explicit and tag-based.

Current centralized tags live in `lib/config/constants/cache.ts`:

- `dashboard-stats`
- `dashboard-payments`
- `dashboard-registrations`
- `dashboard-recent-users`
- `settings`
- `sponsors`
- `tournaments`
- `users`

Pattern:

- services declare `cacheLife(...)` and `cacheTag(...)`
- mutations invalidate with `revalidateTag(...)` or `updateTag(...)`

This gives the app ISR-style freshness without moving data loading into client-side fetch waterfalls.

## 10. Tournament Domain

The tournament model is the core business object.

A tournament can contain:

- a format: `SOLO` or `TEAM`
- a lifecycle state: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- dynamic registration fields
- optional paid registration settings
- optional donation settings
- optional team-logo support
- optional Toornament stage mapping
- optional per-tournament stream URL override

Public tournament pages combine data from:

- `getPublicTournamentBySlug(...)`
- `getAvailableTeams(...)` for team tournaments
- `getUserTournamentRegistrationState(...)` for the logged-in player
- global settings for Twitch fallback data

## 11. Registration and Payment Flow

### Free registration

The app creates or updates the registration server-side and confirms participation immediately according to the relevant business rules.

### Paid registration

Paid registrations use Stripe Checkout.

High-level flow:

1. action creates a pending registration and payment record
2. the slot is reserved for `REGISTRATION_HOLD_MINUTES`
3. the browser is redirected to Stripe Checkout
4. `/api/webhook` confirms, expires, or fails the registration
5. cache tags are revalidated so public and admin views stay in sync

Webhook responsibilities include:

- validating session/payment metadata
- confirming checkout completion only when payment is truly paid
- expiring stale checkout sessions
- handling payment failures
- reconciling refunds and terminal payment states

Refund logic is DB-first and uses shared helpers in `lib/utils/stripe-refund.ts` and `lib/actions/registration-cancellation.ts`.

## 12. Team Management

The team subsystem supports:

- captain-led team creation,
- joining available teams,
- kicking players,
- captain promotion,
- team rename,
- dissolve flows,
- optional public team-logo upload when enabled on a published tournament.

Team logos are uploaded through `/api/blobs/team-logo` and gated by:

- authentication,
- captain ownership,
- tournament publication state,
- `teamLogoEnabled` flag,
- image MIME and magic-byte validation,
- max upload size limits.

## 13. Media Storage

The platform uses Vercel Blob for image storage.

### Admin media API

`/api/admin/blobs` supports:

- listing files,
- uploading images,
- deleting files.

Security checks include:

- admin verification,
- folder allowlist validation,
- image MIME validation,
- magic-byte inspection,
- file-size limits,
- URL validation before deletion.

### Public team logo API

`/api/blobs/team-logo` is separate from the admin media API and is scoped to authenticated captains only.

## 14. Global Settings and Content Management

The app stores a singleton global settings record used to configure:

- site logo
- Twitch username and channel URL
- Discord and social links
- home page feature-card titles and descriptions

`lib/services/settings.ts` returns a typed fallback object when the singleton row is absent or unavailable.

## 15. Database Model

The Prisma schema defines these main entities:

- `User`
- `Session`
- `Account`
- `Verification`
- `Tournament`
- `ToornamentStage`
- `TournamentField`
- `Team`
- `TeamMember`
- `TournamentRegistration`
- `Payment`
- `GlobalSettings`
- `Sponsor`

Important enums include:

- `Role`
- `TournamentFormat`
- `FieldType`
- `TournamentStatus`
- `RegistrationType`
- `RegistrationStatus`
- `PaymentStatus`
- `RefundPolicyType`
- `DonationType`
- `PaymentProvider`

Important constraints:

- one registration per user per tournament
- unique team name per tournament
- generated Prisma client output lives in `prisma/generated/prisma`
- enum values are consumed from `@/prisma/generated/prisma/enums`

## 16. Validation and Domain Rules

Validation lives in `lib/validations/` and is powered by Zod v4.

Conventions enforced across the repo:

- numeric form inputs use `z.number()` and React Hook Form `valueAsNumber`
- shared bounds come from `lib/config/constants/validation.ts`
- monetary amounts are stored in centimes
- formatting and parsing go through `lib/utils/formatting.ts`

This avoids duplicated validation logic between server actions, forms, and data transformations.

## 17. Quality and Testing

Tests live in the top-level `tests/` directory and run with Vitest in `node` mode with globals enabled.

Coverage spans:

- actions
- services
- API routes
- validations
- utilities
- SEO helpers
- proxy/access rules

CI currently runs:

1. `pnpm exec tsc --noEmit`
2. `pnpm exec biome check .`
3. `pnpm test:coverage`

Pre-commit only runs Biome on staged TypeScript and CSS files.

## 18. Configuration and Environment

Environment variables are validated centrally in `lib/core/env.ts`.

Key operational details:

- Prisma CLI reads `.env.local` through `prisma.config.ts`
- local schema changes should go through `pnpm migrate`
- `pnpm build` and `pnpm db:deploy` both run migrations and seeds
- `ADMIN_EMAILS` is used for admin seeding
- `SUPER_ADMIN_EMAILS` is used for super admin seeding

Both are seed-time only. The `SUPER_ADMIN` role is stored in the database.

## 19. Deployment Model

The app is intended for Vercel deployment.

The build command is intentionally operational:

```bash
prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build
```

Implication:

- a production build is also a database deployment step.

That behavior is convenient for deploy targets but must be treated carefully in local and preview environments.

## 20. Key Conventions

- UI text is French.
- Code, comments, and identifiers are English.
- Every `.ts` and `.tsx` file starts with the repo header block.
- New constants should go in `lib/config/constants/*`.
- Runtime env access should go through `lib/core/env.ts`, except for edge and Prisma bootstrap code.
- `cn()` is imported from `@/lib/utils/cn`.

## 21. Primary Risks and Tradeoffs

The project intentionally favors:

- server-driven data flows over client-side API orchestration,
- explicit validation and auth boundaries over convenience shortcuts,
- tag-based cache invalidation over ad hoc refresh logic,
- and DB-first payment reconciliation for operational consistency.

That makes the codebase more predictable in production, at the cost of more structure in the service/action layers.
