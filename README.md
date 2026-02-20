# Belouga Tournament

<div align="center">
  <h3>Modern Tournament Management Platform</h3>
  <p>Built with Next.js 16, Prisma 7, and TailwindCSS v4.</p>
</div>

## 📝 Description

**Belouga Tournament** is a robust, full-stack tournament management platform redesigned for modern e-sports communities. Migrated from a legacy stack to **Next.js 16 (App Router)**, it focuses on performance, type safety, and developer experience.

The platform enables administrators to host and manage diverse gaming tournaments (creation, custom dynamic forms, brackets) while providing a seamless registration experience for players (Solo/Team).

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, RSC)
- **Database:** PostgreSQL (via Vercel Postgres)
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Types:** TypeScript (Strict)
- **UI:** [shadcn/ui](https://ui.shadcn.com/) + [TailwindCSS v4](https://tailwindcss.com/)
- **State/Form:** React Hook Form + Zod v4 + Server Actions
- **Animations:** Framer Motion + Tailwind Animate
- **Tooling:** [Biome](https://biomejs.dev/) (Linting/Formatting)

## ✨ Core Features

### 🎮 Public Interface
- **Dynamic Landing Page:** Features "Hero" tournament, live Twitch integration (`quentadoulive`).
- **Tournament Hub:** Detailed views including rules, cashprize, dynamic format (Solo/Team), and embedded **Toornament** brackets.
- **Registration Engine:**
  - **Dynamic Fields:** Support for admin-defined questions (Riot ID, Rank, etc.).
  - **Team Management:** Built-in support for Captain + Teammates flow.
  - **Validation:** Real-time checks for quotas (SLOT limits) and dates.

### 🛡️ Admin Dashboard
- **Secure Access:** JWT-based protection via middleware proxy.
- **Tournament CRUD:** Full lifecycle management (Draft -> Published -> Archived).
- **Form Builder:** intuitive UI to add/remove custom registration fields per tournament.
- **Registrations:**
  - Data table export (CSV/Excel).
  - Moderation capabilities (Delete/Update).
- **Configuration:** Global site settings (Logo, etc.) and Admin management.

## � Project Structure

```bash
├── app/                  # Next.js App Router
│   ├── (public)/         # Public facings routes (Landing, Tournaments)
│   ├── admin/            # Protected Admin Dashboard routes
│   └── api/              # API endpoints (Webhooks, etc.)
├── components/           # React Components
│   ├── features/         # Domain-specific components (Tournament, Auth, etc.)
│   ├── layout/           # Layout components (Headers, Footers, Sections)
│   └── ui/               # Reusable primitives (shadcn/ui)
├── lib/                  # Core Utilities & Business Logic
│   ├── actions/          # Server Actions
│   ├── config/           # Configuration primitives (Routes, Messages)
│   ├── data/             # Data Access Layer (Queries/Mutations)
│   ├── validations/      # Zod Schemas
│   ├── auth.ts           # Authentication logic
│   └── env.ts            # Environment verification
├── prisma/               # Database Schema & Seeds
└── public/               # Static Assets
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 25+ (tested with 25.6.1)
- Docker & Docker Compose (for local database)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/henchoznoe/belouga-tournament.git
    cd belouga-tournament
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    Duplicate `.env.example` to `.env` and fill in your secrets.
    ```bash
    cp .env.example .env
    ```
    *Note: Your local `.env` should point to your Docker PostgreSQL instance (postgresql://postgres:postgres@localhost:5432/belouga_tournament)*

4.  **Database Initialization:**
    ```bash
    # Start local Docker infrastructure
    pnpm docker:up

    # Generate Prisma Client and apply migrations to local DB
    pnpm migrate

    # Launch Prisma Studio
    pnpm db:studio
    ```

5.  **Run Development Server:**
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
| `pnpm check` | Runs **Biome** to check for linting and formatting errors and applies fixes. |
| `pnpm generate` | Generates Prisma client. |
| `pnpm migrate` | Creates and applies local migrations (prisma migrate dev). Use this when altering `schema.prisma`. |
| `pnpm db:deploy` | Applies pending migrations and seeds the database (used automatically during build). |
| `pnpm db:reset` | Resets the database (Force). |
| `pnpm db:studio` | Opens Prisma Studio to visualize data. |
| `pnpm docker:up` | Starts the local infrastructure (PostgreSQL). |
| `pnpm docker:down` | Stops the local infrastructure. |

## 🏗️ Deployment (Vercel)

We use a strict 3-tier database architecture to ensure data safety:

- **Local**: Docker Container (`belouga_tournament_db`)
- **Preview**: Supabase Staging Project
- **Production**: Supabase Production Project

### Vercel configuration

1. Environment variables

- Do not use `.env.preview` or `.env.production` files.
- Go to **Vercel Project Settings > Environment Variables**.
- Assign variables to the specific **Environment** (Preview or Production).

2. Automated migrations

- Vercel automatically handles database migrations during deployment.
- The `build` script in `package.json` (`prisma generate && prisma migrate deploy && tsx prisma/seed-admin.ts && next build`) ensures that the target database is always up-to-date before compiling the application.
- **Important**: Never use `prisma migrate dev` on a remote database. Always use `pnpm migrate` locally and commit the generated SQL files.

## 📄 License

This project is licensed under the MIT License.
