# AGENTS.md

## Project Overview

Belouga Tournament — a full-stack e-sports tournament management platform.
Next.js 16 (App Router, RSC, Server Actions), React 19, TypeScript (strict), Prisma 7 (PostgreSQL), BetterAuth (Discord OAuth), TailwindCSS v4, shadcn/ui. Hosted on Vercel. UI text is in French; code and comments are in English.

## Build / Lint / Test Commands

| Command                | Description                                      |
|------------------------|--------------------------------------------------|
| `pnpm dev`             | Start the dev server                             |
| `pnpm build`           | Prisma generate + migrate + seed + Next.js build |
| `pnpm lint`            | Run Biome linter                                 |
| `pnpm format`          | Run Biome formatter (write mode)                 |
| `pnpm check`           | Run Biome check (lint + format, write mode)      |
| `pnpm test`            | Run all tests (Vitest)                           |
| `pnpm test:coverage`   | Run tests with v8 coverage                       |
| `pnpm knip`            | Detect dead/unused code                          |
| `pnpm docker:up`       | Start local PostgreSQL container                 |
| `pnpm docker:down`     | Stop local PostgreSQL container                  |
| `npx tsc --noEmit`     | Type-check without emitting                      |

### Running a single test

```bash
pnpm vitest run tests/path/to/file.test.ts          # run one file
pnpm vitest run -t "test name pattern"               # run by name
```

Tests live in the top-level `tests/` directory (not colocated with source). Pattern: `tests/**/*.test.ts`. Vitest is configured with `globals: true` (no need to import `describe`/`it`/`expect`).

### CI Pipeline (.github/workflows/ci.yml)

Runs on push/PR to `main` and `develop`: pnpm install → `tsc --noEmit` → `biome lint` → `biome format --check` → `vitest run`.

### Pre-commit Hook

Husky + lint-staged runs `biome check --write` on staged `*.{ts,tsx,css}` files.

## Code Style

### Formatter / Linter: Biome (NOT ESLint/Prettier)

- **Quotes:** single quotes
- **Semicolons:** as needed (omitted where possible)
- **Trailing commas:** all
- **Arrow function parens:** as needed
- **Indent:** 2 spaces (`.editorconfig`: UTF-8, LF, max 120 chars)
- `noExplicitAny: error` — avoid `any`; use Biome ignore comment only when truly unavoidable
- `useNodejsImportProtocol: error` — use `node:` prefix for Node.js built-ins

### File Headers

Every `.ts`/`.tsx` file must have this JSDoc block at the top:

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

1. External/third-party packages first
2. Internal imports using the `@/` path alias second
3. No blank lines between groups (Biome enforces order)

```ts
import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/config/routes'
```

### Components

- **Arrow functions only** — `const MyComponent = () => { ... }`
- **Named exports** for feature/UI components: `export const MyComponent = ...`
- **Default exports** for pages/layouts only — on a separate final line: `export default MyPage`
- `'use client'` directive goes **after** the file header comment
- Props are destructured in parameters
- Use `interface` for component props; use `type` for unions/aliases

### Naming Conventions

| Kind              | Convention          | Example                            |
|-------------------|---------------------|------------------------------------|
| Files             | kebab-case          | `public-navbar.tsx`, `safe-action.ts` |
| Components        | PascalCase          | `PublicNavbar`, `HeroSection`      |
| Variables/funcs   | camelCase           | `isScrolled`, `handleLogout`       |
| Constants (objects)| UPPER_SNAKE_CASE   | `ROUTES`, `METADATA`               |
| Types/Interfaces  | PascalCase          | `AuthSession`, `ActionState`       |
| Prisma enums      | UPPER_SNAKE_CASE    | `ADMIN`, `SUPERADMIN`, `DRAFT`     |

### Types and Validation

- Type definitions go in `lib/types/`
- Zod schemas go in `lib/validations/`
- Prisma-generated types are imported from `@/prisma/generated/prisma/`
- Use `as const` assertions on constant objects
- Environment variables are validated with Zod at startup (`lib/core/env.ts`)

### Error Handling

- **Server actions:** wrap with `authenticatedAction` helper (auth + role check + Zod validation + Prisma error mapping + Sentry capture)
- **Prisma errors:** use `handlePrismaError()` from `lib/utils/prisma-error.ts` to map to user-friendly `ActionState` responses
- **Client-side:** `try/catch` blocks with `Sentry.captureException()` and `toast.error()` (Sonner)
- **Error boundaries:** `app/error.tsx` (root) and segment-level `error.tsx` files

### Styling

- TailwindCSS v4 with CSS variables — configured in `app/globals.css`
- `cn()` utility (clsx + tailwind-merge) for conditional class merging — import from `@/lib/utils/cn`
- shadcn/ui components in `components/ui/` (new-york style, zinc base color, lucide icons)
- Icons: Lucide React for UI icons, FontAwesome for brand icons

## Project Structure

```
app/
├── (public)/             # Public pages (landing, tournaments, stream, contact)
├── admin/                # Protected admin routes (RBAC via AdminGuard + proxy)
├── api/auth/             # BetterAuth API handler
├── login/                # Login page
└── layout.tsx            # Root layout (fonts, Lenis, Toaster, ErrorBoundary)

components/
├── features/             # Domain components (auth/, contact/, landing/, layout/, stream/)
└── ui/                   # Reusable primitives (shadcn/ui + custom)

lib/
├── actions/              # Server action helpers (authenticatedAction)
├── config/               # Routes, constants
├── core/                 # Auth, Prisma client, env validation, logger, auth-client
├── hooks/                # Custom React hooks
├── services/             # Business logic (auth session, settings)
├── types/                # TypeScript type definitions
├── utils/                # Utilities (cn, formatting, prisma-error, auth helpers)
└── validations/          # Zod schemas

prisma/
├── schema.prisma         # Database schema
├── generated/            # Generated Prisma client (gitignored)
├── migrations/           # SQL migrations
└── seed-admin.ts         # Admin seed script

tests/                    # Unit tests (top-level, NOT colocated)
proxy.ts                  # Edge middleware for admin route protection
```

## Key Patterns

- **Server-only modules:** import `'server-only'` in modules that must never be bundled client-side (e.g., `logger.ts`)
- **Prisma singleton:** global caching pattern in `lib/core/prisma.ts` to avoid multiple instances in dev
- **Auth flow:** BetterAuth with Discord OAuth → session stored in DB → `getAuthSession()` for server-side checks → `authClient.useSession()` for client
- **Admin protection:** dual-layer — edge `proxy.ts` middleware + `AdminGuard` client component with role check
- **Env vars:** validated at startup via Zod (`lib/core/env.ts`); never access `process.env` directly elsewhere
- **Monitoring:** Sentry configured for server, edge, and client (instrumentation files at project root)
