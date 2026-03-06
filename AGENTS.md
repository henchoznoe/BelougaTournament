# AGENTS.md

## Project Overview

Belouga Tournament — full-stack e-sports tournament management platform.
Next.js 16 (App Router, RSC, Server Actions), React 19, TypeScript (strict), Prisma 7 (PostgreSQL), BetterAuth (Discord OAuth), TailwindCSS v4, shadcn/ui. Hosted on Vercel. **UI text is in French; code and comments are in English.**

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
| Prisma enums       | UPPER_SNAKE_CASE | `SUPERADMIN`, `DRAFT`            |

### Types & Validation

- Type definitions in `lib/types/`, Zod schemas in `lib/validations/`, Prisma types from `@/prisma/generated/prisma/`.
- **Zod v4** — uses `z.url()`, `z.uuid()`. Use `z.number()` + `register('field', { valueAsNumber: true })` for numeric fields (not `z.coerce.number()`).
- Env vars validated at startup via Zod (`lib/core/env.ts`); **never** access `process.env` directly.
- Use `as const` on constant objects.

### Error Handling

- **Server actions**: `authenticatedAction` wrapper (auth + role + Zod + Prisma error mapping + logger)
- **Services**: `try/catch` + `logger.error({ error }, 'message')` + fallback return
- **API routes**: `try/catch` + `logger.error({ error }, 'message')` + JSON error response
- **Client-side**: `try/catch` + `console.error()` + `toast.error()` (Sonner) — `logger` is `server-only`
- **Prisma errors**: `handlePrismaError()` from `lib/utils/prisma-error.ts`
- **Never** use bare `console.log/warn/error` in server-side runtime code — use `logger.*` instead

### Styling

- TailwindCSS v4, CSS variables in `app/globals.css`
- `cn()` from `@/lib/utils/cn` (clsx + tailwind-merge) — **not** `@/lib/utils`
- shadcn/ui: new-york style, zinc base, lucide icons. Install: `pnpm dlx shadcn@latest add <name> -y`
- After install: fix import to `@/lib/utils/cn`, add file header, convert to arrow functions

## Project Structure

```
app/
├── (public)/             # Public pages (landing, tournaments, stream, contact, profile)
├── admin/                # Protected admin (AdminGuard + proxy.ts edge middleware)
├── api/admin/blobs/      # Vercel Blob upload/list/delete API
├── api/auth/[...all]/    # BetterAuth handler
├── login/                # Discord OAuth login
└── not-found.tsx         # 404 page

components/
├── features/             # Domain components (admin/, auth/, landing/, layout/, profile/)
└── ui/                   # shadcn/ui primitives

lib/
├── actions/              # Server actions (authenticatedAction wrapper)
├── config/               # Routes, constants (CACHE_TAGS, METADATA), admin-nav
├── core/                 # Auth, Prisma client, env validation, logger
├── services/             # Data access with 'use cache' + cacheTag/cacheLife
├── types/                # TypeScript types (ActionState, AuthSession)
├── utils/                # cn, formatting, prisma-error, auth helpers, toNullable
└── validations/          # Zod schemas

prisma/                   # Schema, migrations, seed, generated client (gitignored)
tests/                    # Unit tests (top-level, NOT colocated)
proxy.ts                  # Edge middleware for /admin/* route protection
```

## Key Patterns

### Server Actions

```ts
export const myAction = authenticatedAction({
  schema: myZodSchema,
  role: Role.SUPERADMIN,
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

### Prerender Rules (`cacheComponents: true`)

1. **No `new Date()` in components** — hardcode or compute at build time
2. **Dynamic APIs** (`headers()`, `cookies()`) **require `<Suspense>`** wrapping the component that calls them

### Forms (Client Components)

`react-hook-form` + `zodResolver` + `useTransition` + server action + `toast.success()`/`toast.error()` (Sonner).

### Other

- **`server-only`** import in modules that must not be bundled client-side
- **Prisma singleton** with global caching in `lib/core/prisma.ts`
- **Auth**: BetterAuth + Discord OAuth → `getSession()` server-side, `authClient.useSession()` client-side
- **Admin protection**: dual-layer — edge `proxy.ts` + `AdminGuard` server component
- **Accessibility**: all icon-only buttons use `aria-label` (not `title`); all `<nav>` elements have `aria-label`; search inputs have `aria-label`
- **Vercel Blob**: images stored via `/api/admin/blobs` with folder prefix (`logos/`, `sponsors/`). Allowed types: PNG, JPEG, WebP (no SVG). Blob DELETE validates URL domain.
