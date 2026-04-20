<div align="center">

<img src="public/assets/logo-blue.png" alt="Logo" width="auto" height="200">

[![CI](https://github.com/henchoznoe/BelougaTournament/actions/workflows/ci.yml/badge.svg)](https://github.com/henchoznoe/BelougaTournament/actions/workflows/ci.yml)
[![main](https://img.shields.io/codecov/c/github/henchoznoe/BelougaTournament/main?token=XTVICSSEDD&label=main&logo=codecov)](https://codecov.io/github/henchoznoe/BelougaTournament)
[![develop](https://img.shields.io/codecov/c/github/henchoznoe/BelougaTournament/develop?token=XTVICSSEDD&label=develop&logo=codecov)](https://codecov.io/github/henchoznoe/BelougaTournament)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/henchoznoe/BelougaTournament)
[![Biome](https://img.shields.io/badge/formatter|linter-biome-39B420?style=flat&logo=biome)](https://biomejs.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fbelougatournament.ch&label=Site%20Web)](https://belougatournament.ch)

## Modern Tournament Management Platform

Built with Next.js 16, Prisma 7, and TailwindCSS v4.

</div>

## 📝 Description

**Belouga Tournament** is a robust, full-stack tournament management platform redesigned for modern e-sports communities. Migrated from a legacy stack to **Next.js 16 (App Router)**, it focuses on performance, type safety, developer experience, and a premium "Dark Glass" gamer aesthetic.

The platform enables administrators to host and manage diverse gaming tournaments (creation, custom dynamic fields, brackets via Toornament) while providing a frictionless, 1-click Discord registration experience for players (Solo/Team), including Stripe-powered paid registrations with automated refund management.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, RSC, `cacheComponents`)
- **Database:** PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM:** [Prisma 7](https://www.prisma.io/) (PrismaPg adapter, raw SQL via `$queryRaw`)
- **Authentication:** [BetterAuth](https://better-auth.com/) (Discord OAuth Provider)
- **Payments:** [Stripe](https://stripe.com/) (Checkout Sessions, Webhooks, Refunds)
- **Object Storage:** [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) (Banners, Sponsor Logos)
- **Types:** TypeScript (Strict)
- **UI:** [shadcn/ui](https://ui.shadcn.com/) (new-york, zinc) + [TailwindCSS v4](https://tailwindcss.com/)
- **State/Form:** React Hook Form + Zod v4 + Server Actions
- **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown)
- **Tooling:** [Biome](https://biomejs.dev/) (Linting/Formatting — replaces ESLint + Prettier)
- **Tests:** [Vitest](https://vitest.dev/) + `@vitest/coverage-v8`

## ✨ Core Features

### 🎮 Public Interface

- **Dynamic Landing Page:** Hero tournament badge (live/upcoming state), sponsor showcase, and Twitch stream integration.
- **1-Click Discord Login:** Frictionless authentication relying on immutable Discord IDs.
- **Tournament Hub:** Detailed views including rules, cashprize, dynamic format (Solo/Team) with real-time status badges (`PRÉVU`, `EN COURS`, `TERMINÉ`).
- **Registration Engine:**
  - **Paid registrations:** Stripe Checkout with a 30-minute slot hold; automatic refunds on cancellation.
  - **Dynamic Fields:** Admin-defined custom questions (Riot ID, Rank, etc.).
  - **Team Management:** Full Captain + Teammates flow (create, join, rename, dissolve).
  - **Validation:** Real-time quota (slot limits) and deadline checks.
- **Profile Page:** View active registrations, edit display name, manage team membership.

### 🛡️ Admin Dashboard

- **Dual-Layer Security:** Edge middleware (`proxy.ts`) + `AdminGuard` server component.
- **Tournament CRUD:** Full lifecycle management (Draft → Published → Archived).
- **Form Builder:** Configure custom dynamic registration fields per tournament.
- **Registration & Team Moderation:** Kick players, dissolve teams, change teams, promote captains, issue refunds.
- **Platform Management:** Sponsor management, global settings (logo, Twitch, socials, feature flags), user role assignment.
- **Vercel Blob integration:** Upload/list/delete images (banners, sponsor logos) from the admin UI.

## 🗂️ Project Structure

```bash
├── app/                  # Next.js App Router
│   ├── (public)/         # Public facing routes (Landing, Tournaments, Profile, Legal, ...)
│   ├── admin/            # Protected Admin Dashboard routes
│   └── api/              # API endpoints (Auth, Blob CRUD, Stripe webhook)
├── components/           # React Components
│   ├── admin/            # Admin domain components
│   │   ├── dashboard/    # Stats, recent logins, payments panels
│   │   ├── hooks/        # Shared admin hooks (useListSort, useBlobList, useLogout, useClientPagination)
│   │   ├── tournaments/  # Tournament list, detail, registrations, teams, form tabs
│   │   ├── users/        # User list, detail, dropdown
│   │   ├── sponsors/     # Sponsor list, form, detail
│   │   ├── settings/     # Settings form, logo picker
│   │   └── ui/           # Admin shell (sidebar, topbar, breadcrumb, skeleton)
│   ├── public/           # Public domain components (auth, contact, landing, layout, legal, profile, stream, tournaments)
│   └── ui/               # Reusable shadcn/ui primitives + custom (markdown, page-header, role-badge, scroll-to-top)
├── lib/                  # Core Utilities & Business Logic
│   ├── actions/          # Server Actions (authenticatedAction wrapper)
│   ├── config/           # Routes, constants (CACHE_TAGS, VALIDATION_LIMITS, time helpers), admin nav
│   ├── core/             # Auth, Prisma client, env validation, logger, Stripe client
│   ├── services/         # Data access with 'use cache' + cacheTag + cacheLife
│   ├── types/            # TypeScript types (ActionState, AuthSession, domain types)
│   ├── utils/            # cn, formatting (formatCentimes, parseCentimes), prisma-error, auth helpers, team helpers
│   └── validations/      # Zod v4 schemas
├── prisma/               # Database Schema, Migrations & Seed
├── public/               # Static Assets
├── tests/                # Unit tests organized by layer (NOT colocated)
└── proxy.ts              # Edge middleware — /admin/* route protection
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 22+ (CI uses Node 22)
- Docker & Docker Compose (for local database)
- pnpm

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/henchoznoe/belouga-tournament.git
    cd belouga-tournament
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Environment Setup:**
    Duplicate `.env.example` to `.env.local` and fill in your secrets (Discord OAuth, Stripe keys, Vercel Blob token, ...).

    ```bash
    cp .env.example .env.local
    ```

    *Note: Your local `.env.local` should point to your Docker PostgreSQL instance (`postgresql://postgres:postgres@localhost:5432/belouga_tournament`).*

4. **Database Initialization:**

    ```bash
    # Start local Docker infrastructure
    pnpm docker:up

    # Generate Prisma Client and apply migrations to local DB
    pnpm migrate

    # (Optional) Launch Prisma Studio
    pnpm db:studio
    ```

5. **Run Development Server:**

    ```bash
    pnpm dev
    ```

    > Visit [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server. |
| `pnpm build` | Generates Prisma client, applies pending migrations, seeds admin data, and builds the app. |
| `pnpm start` | Starts the production server. |
| `pnpm lint` | Runs **Biome** to check for linting errors. |
| `pnpm format` | Formatting fix with Biome. |
| `pnpm check` | Runs **Biome** lint + format and applies fixes. |
| `pnpm test` | Runs all Vitest tests. |
| `pnpm test:coverage` | Runs Vitest with v8 coverage report. |
| `pnpm knip` | Detects dead/unused code. |
| `pnpm generate` | Generates Prisma client. |
| `pnpm migrate` | Creates and applies local migrations (`prisma migrate dev`). Use when altering `schema.prisma`. |
| `pnpm db:deploy` | Applies pending migrations and seeds the database (used automatically during build). |
| `pnpm db:reset` | Resets the database (Force). |
| `pnpm db:studio` | Opens Prisma Studio to visualize data. |
| `pnpm docker:up` | Starts the local infrastructure (PostgreSQL). |
| `pnpm docker:down` | Stops the local infrastructure. |

## 🏗️ Deployment (Vercel)

We use a strict 3-tier database architecture to ensure data safety:

- **Local**: Docker Container (`belouga_tournament_db`)
- **Preview**: Supabase Staging Project (on branch `develop`)
- **Production**: Supabase Production Project (on branch `main`)

### Vercel configuration

1. **Environment variables**

- Do not use `.env.preview` or `.env.production` files.
- Go to **Vercel Project Settings > Environment Variables**.
- Assign variables to the specific **Environment** (Preview or Production).

2. **Automated migrations**

- Vercel automatically handles database migrations during deployment.
- The `build` script (`prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build`) ensures the target database is always up-to-date before compiling.
- **Important**: Never use `prisma migrate dev` on a remote database. Always use `pnpm migrate` locally and commit the generated SQL files.

## 📄 License

This project is licensed under the MIT License.
