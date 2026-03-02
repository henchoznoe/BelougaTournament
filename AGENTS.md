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
| `pnpm test`          | Vitest (all tests)                               |
| `pnpm test:coverage` | Vitest with v8 coverage                          |
| `pnpm knip`          | Detect dead/unused code                          |
| `npx tsc --noEmit`   | Type-check only                                  |
| `pnpm docker:up`     | Start local PostgreSQL                           |

```bash
# Single test
pnpm vitest run tests/path/to/file.test.ts
pnpm vitest run -t "test name pattern"
```

Tests live in the top-level `tests/` directory (not colocated). Vitest `globals: true`.

**CI** (`.github/workflows/ci.yml`): Node 22 + pnpm 10 → `tsc --noEmit` → `biome lint` → `biome format` → `vitest run`.
**Pre-commit**: Husky + lint-staged runs `biome check --write` on staged `*.{ts,tsx,css}`.

## Code Style

### Biome (NOT ESLint/Prettier)

Single quotes, semicolons as-needed, trailing commas all, arrow parens as-needed, 2-space indent, 120 char max line (`.editorconfig`). `noExplicitAny: error`, `useNodejsImportProtocol: error`.

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

1. External packages first, then internal `@/` imports. No blank lines between groups.

### Components

- **Arrow functions only**: `const MyComponent = () => { ... }`
- **Named exports** for feature/UI components: `export const MyComponent = ...`
- **Default exports** for pages/layouts only, on a separate final line
- `'use client'` / `'use server'` goes **after** the file header
- Props destructured in parameters; use `interface` for props, `type` for unions

### Naming

| Kind               | Convention       | Example                          |
|--------------------|------------------|----------------------------------|
| Files              | kebab-case       | `safe-action.ts`                 |
| Components         | PascalCase       | `PublicNavbar`                   |
| Variables/funcs    | camelCase        | `handleLogout`                   |
| Constants (objects)| UPPER_SNAKE_CASE | `ROUTES`, `ADMIN_NAV`            |
| Types/Interfaces   | PascalCase       | `AuthSession`, `ActionState`     |
| Prisma enums       | UPPER_SNAKE_CASE | `SUPERADMIN`, `DRAFT`            |

### Types & Validation

- Type definitions: `lib/types/`. Zod schemas: `lib/validations/`. Prisma types: `@/prisma/generated/prisma/`.
- **Zod v4** (`^4.3.6`) — uses `z.url()`, `z.uuid()`.
- Env vars validated at startup via Zod (`lib/core/env.ts`); never access `process.env` directly.
- Use `as const` on constant objects.

### Error Handling

- **Server actions**: `authenticatedAction` wrapper (auth + role + Zod + Prisma error mapping + logger)
- **Services**: `try/catch` + `console.error()` + fallback return
- **Client-side**: `try/catch` + `console.error()` + `toast.error()` (Sonner)
- **Prisma errors**: `handlePrismaError()` from `lib/utils/prisma-error.ts`

### Styling

- TailwindCSS v4, CSS variables in `app/globals.css`
- `cn()` from `@/lib/utils/cn` (clsx + tailwind-merge) — **not** `@/lib/utils`
- shadcn/ui: new-york style, zinc base, lucide icons. Install: `pnpm dlx shadcn@latest add <name> -y`
- After install, fix imports to `@/lib/utils/cn`, add file header, convert to arrow functions

## Project Structure

```
app/
├── (public)/             # Public pages (landing, tournaments, stream, contact, profile)
├── admin/                # Protected admin (AdminGuard + proxy.ts edge middleware)
│   ├── settings/         # Global settings (SUPERADMIN)
│   └── sponsors/         # Sponsors CRUD (SUPERADMIN)
├── api/admin/blobs/      # Vercel Blob upload/list/delete API
├── api/auth/[...all]/    # BetterAuth handler
├── login/                # Discord OAuth login
└── not-found.tsx         # 404 page

components/
├── features/             # Domain components (admin/, auth/, landing/, layout/, etc.)
└── ui/                   # shadcn/ui primitives

lib/
├── actions/              # Server actions (authenticatedAction wrapper)
├── config/               # Routes, constants, admin-nav
├── core/                 # Auth, Prisma client, env validation, logger
├── services/             # Data access with caching (settings, sponsors, users)
├── types/                # TypeScript types (ActionState, AuthSession)
├── utils/                # cn, formatting, prisma-error, auth helpers
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
    revalidateTag('tag-name', 'hours') // 2nd arg must match cacheLife profile
    return { success: true, message: 'French message.' }
  },
})
```

### Cached Services

```ts
export const getData = async () => {
  'use cache'
  cacheLife('hours')
  cacheTag('my-tag')
  // Prisma query with try/catch + console.error
}
```

`revalidateTag(tag, profile)` requires **two arguments** — the profile must match the `cacheLife()` used.

### Prerender Rules (`cacheComponents: true`)

1. **No `new Date()` in components** — hardcode or compute at build time
2. **Dynamic APIs** (`headers()`, `cookies()`) **require `<Suspense>`**:

```tsx
const Dynamic = async () => { const session = await getSession(); /* ... */ }
const Page = () => <Suspense fallback={<Skeleton />}><Dynamic /></Suspense>
export default Page
```

### Forms (Client Components)

`react-hook-form` + `zodResolver` + `useTransition` + server action + `toast`:

```ts
const { register, handleSubmit, formState: { errors } } = useForm<Input>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})
const onSubmit = (data: Input) => {
  startTransition(async () => {
    const result = await serverAction(data)
    result.success ? toast.success(result.message) : toast.error(result.message)
  })
}
```

Use `z.number()` + `register('field', { valueAsNumber: true })` for numeric fields (not `z.coerce.number()`).

### Vercel Blob Uploads

Images are stored in Vercel Blob via `/api/admin/blobs`. Uploads are organized by folder prefix:

| Folder     | Usage                    |
|------------|--------------------------|
| `logos/`   | Site logo (LogoPicker)   |
| `sponsors/`| Sponsor images           |

Pass `folder` field in FormData on POST, `?folder=` query param on GET. Allowed folders are validated server-side against `ALLOWED_FOLDERS`.

### Other

- **`server-only`** import in modules that must not be bundled client-side
- **Prisma singleton** with global caching in `lib/core/prisma.ts`
- **Auth**: BetterAuth + Discord OAuth → `getSession()` server-side, `authClient.useSession()` client-side
- **Admin protection**: dual-layer — edge `proxy.ts` + `AdminGuard` server component
