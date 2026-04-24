<div align="center">

<img src="public/assets/logo-blue.png" alt="Logo" width="auto" height="200">

[![CI](https://github.com/henchoznoe/BelougaTournament/actions/workflows/ci.yml/badge.svg)](https://github.com/henchoznoe/BelougaTournament/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/henchoznoe/BelougaTournament/main?label=coverage&logo=codecov)](https://codecov.io/github/henchoznoe/BelougaTournament)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fbelougatournament.ch&label=Website)](https://belougatournament.ch)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/henchoznoe/BelougaTournament)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Biome](https://img.shields.io/badge/formatter|linter-biome-39B420?style=flat&logo=biome)](https://biomejs.dev/)
[![Lines of Code](https://img.shields.io/badge/dynamic/json?label=lines%20of%20code&query=%24%5B-1%3A%5D.linesOfCode&url=https%3A%2F%2Fapi.codetabs.com%2Fv1%2Floc%3Fgithub%3Dhenchoznoe%2FBelougaTournament&color=blue)](https://github.com/henchoznoe/BelougaTournament)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Belouga Tournament

Tournament management platform for modern e-sports communities.

</div>

## Overview

**Belouga Tournament** is a production-ready full-stack platform for running amateur e-sports tournaments with a polished public-facing experience and a complete admin back office.

The project is built with **Next.js 16**, **React 19**, **Prisma 7**, **PostgreSQL**, **Better Auth**, and **Stripe**. It supports **Discord login**, **solo and team registrations**, **paid checkouts with refund workflows**, **Toornament stage mapping**, **Twitch embeds**, **sponsor management**, and a full **admin dashboard** for operating the platform end to end.

## Highlights

- Public landing page with hero badge, featured tournaments, live stream section, sponsors, and configurable marketing content.
- Discord OAuth authentication with server-side session handling.
- Tournament hub with published and archived listings, filters, pagination, and detailed tournament pages.
- Registration flows for both **solo** and **team** formats.
- Paid tournaments powered by Stripe Checkout with slot reservation, webhook confirmation, expiration handling, and refunds.
- Team management flows: create, join, rename, captain actions, and optional team logo upload.
- Admin dashboard for tournaments, users, sponsors, global settings, registrations, teams, and payment visibility.
- Cached server-side data layer built around Next.js `cacheComponents`, `cacheLife`, and `cacheTag`.
- Strict validation and type safety with Zod v4, TypeScript strict mode, Prisma enums, and automated tests.

## Product Scope

### Public experience

- Landing page with configurable features, sponsor section, and Twitch stream integration.
- Tournament catalogue with upcoming and archived competitions.
- Tournament detail pages with rules, prize, stream, bracket stage references, dynamic custom fields, and registration status.
- User profile with active tournaments, registration history, and editable display name.
- Legal, privacy, terms, contact, login, unauthorized, and stream pages.

### Admin experience

- Dashboard with platform stats, recent activity, and payment summaries.
- Tournament CRUD with dynamic registration fields, stage configuration, images, payment options, donation settings, and publication lifecycle.
- Registration moderation including cancellation, refund, field updates, and team-level management.
- User administration including role changes, bans, and cleanup of active registrations.
- Sponsor CRUD and global platform settings management.
- Vercel Blob-backed file handling for logos, sponsors, tournaments, and team logos.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, Server Actions, `cacheComponents`) |
| UI | React 19, TailwindCSS v4, shadcn/ui |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | Prisma 7 with PrismaPg adapter |
| Auth | Better Auth with Discord OAuth |
| Payments | Stripe Checkout, Webhooks, Refunds |
| Storage | Vercel Blob |
| Validation | Zod v4 + react-hook-form |
| Analytics | PostHog (error tracking, session replay, event capture) |
| Quality | Biome, Vitest, Codecov, Husky, lint-staged |
| Hosting | Vercel |

## Project Structure

```bash
.
├── app/                  # Next.js routes, layouts, error pages, API routes
├── components/           # UI split by public/admin/shared domains
├── lib/
│   ├── actions/          # Server mutations
│   ├── services/         # Cached read-side access
│   ├── core/             # Auth, env, logger, Prisma, Stripe
│   ├── config/           # Routes and constants
│   ├── validations/      # Zod schemas
│   ├── utils/            # Formatting, auth, refund, team, image helpers
│   └── types/            # Shared TypeScript types
├── prisma/               # Schema, migrations, seed, generated client
├── public/               # Static assets and fonts
├── tests/                # Top-level Vitest suites
├── proxy.ts              # Edge protection for /admin/*
└── .github/workflows/ci.yml
```

For a deeper technical breakdown, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker
- Stripe CLI if you want to test webhooks locally

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm docker:up
pnpm migrate
pnpm dev
```

The app runs on `http://localhost:3000`.

## Environment

The repo includes a `.env.example` template.

Important variables:

- `DATABASE_URL` and `DIRECT_URL` for PostgreSQL.
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` for auth.
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` for Discord OAuth.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for payments.
- `BLOB_READ_WRITE_TOKEN` for Vercel Blob.
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` for PostHog analytics.
- `ADMIN_EMAILS` for seeding admin accounts.
- `SUPER_ADMIN_EMAILS` for seeding super admin accounts.

Notes:

- Prisma CLI loads `.env.local` through `prisma.config.ts`.
- `ADMIN_EMAILS` and `SUPER_ADMIN_EMAILS` are both used by `prisma/seed-admin.ts` at seed time.
- `pnpm build` and `pnpm db:deploy` both run migrations and seed logic against the configured database.

## Development Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Generate Prisma client, deploy migrations, seed, then build Next.js |
| `pnpm start` | Start the production server |
| `pnpm exec tsc --noEmit` | Run TypeScript type-checking |
| `pnpm exec biome check .` | Run formatter/linter check without writing |
| `pnpm check` | Run Biome and write fixes |
| `pnpm check:com` | Run all checks before commit |
| `pnpm test` | Run Vitest once |
| `pnpm test:coverage` | Run Vitest with coverage |
| `pnpm generate` | Generate Prisma client |
| `pnpm migrate` | Create and apply a local Prisma migration |
| `pnpm db:deploy` | Generate Prisma client, deploy migrations, seed database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm docker:up` | Start local PostgreSQL |
| `pnpm docker:down` | Stop local PostgreSQL |
| `pnpm stripe:listen` | Start Stripe webhook forwarding |

### Focused test runs

```bash
pnpm vitest run tests/path/to/file.test.ts
pnpm vitest run -t "test name"
```

## Quality Workflow

CI runs the following checks in this order:

```bash
pnpm exec tsc --noEmit
pnpm exec biome check .
pnpm test:coverage
```

Pre-commit only runs Biome on staged `*.{ts,tsx,css}` files through `lint-staged`, so local type-checking and tests are still your responsibility before shipping changes.

## Architectural Principles

- **Server mutations** go through `lib/actions/` via `authenticatedAction`.
- **Read-side data access** lives in `lib/services/` and usually uses `'use cache'` with tagged invalidation.
- **Admin access control** is enforced both at the edge (`proxy.ts`) and in the app layer (`AdminGuard`).
- **Session reads** happen server-side through `getSession()` and are passed down as props when possible.
- **Environment access** is centralized in `lib/core/env.ts`, with edge/Prisma exceptions.
- **Prisma enum values** are imported from `@/prisma/generated/prisma/enums`, never hardcoded.
- **Monetary values** are stored in centimes and formatted through shared helpers.

## Payment Model

Paid registrations use a DB-first workflow with Stripe as the payment processor:

- a registration and payment record are created server-side,
- the user is redirected to Stripe Checkout,
- the webhook confirms or expires the registration,
- refund flows update the database first and reconcile Stripe afterward.

This keeps tournament capacity, registration state, and payment state consistent even when external payment steps fail.

## Deployment Notes

The project is designed for Vercel deployment.

- `pnpm build` includes `prisma migrate deploy` and `tsx prisma/seed.ts` before `next build`.
- Local database changes should be created with `pnpm migrate`, then committed as Prisma migrations.
- Do not run `prisma migrate dev` against remote environments.
- The root layout disables indexing outside production via metadata derived from `VERCEL_ENV`.

## Why This Project Exists

Belouga Tournament was built to replace a legacy tournament-management stack with a modern, maintainable, and production-safe architecture while preserving what matters most to the community:

- frictionless player onboarding,
- clean tournament operations,
- reliable payment handling,
- a strong visual identity,
- and a codebase that remains pleasant to evolve after launch.

## License

This project is licensed under the MIT License.
