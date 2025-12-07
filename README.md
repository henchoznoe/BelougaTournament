# Belouga Tournament

<div align="center">
  <h3>Modern Tournament Management Platform</h3>
  <p>Built with Next.js 16, Prisma, and Tailwind CSS.</p>
</div>

## 📝 Description

**Belouga Tournament** is a robust, full-stack tournament management platform redesigned for modern e-sports communities. Migrated from a legacy stack to **Next.js 16 (App Router)**, it focuses on performance, type safety, and developer experience.

The platform enables administrators to host and manage diverse gaming tournaments (creation, custom dynamic forms, brackets) while providing a seamless, account-free registration experience for players (Solo/Team).

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, RSC)
- **Database:** PostgreSQL (via Vercel Postgres)
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Types:** TypeScript (Strict)
- **UI:** [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **State/Form:** React Hook Form + Zod v4 + Server Actions
- **Animations:** Framer Motion + Tailwind Animate
- **Tooling:** [Biome](https://biomejs.dev/) (Linting/Formatting)

## ✨ Core Features

### 🎮 Public Interface
- **Dynamic Landing Page:** Features "Hero" tournament, live Twitch integration (`quentadoulive`), and stats.
- **Tournament Hub:** Detailed views including rules, cashprize, dynamic format (Solo/Team), and embedded **Challonge** brackets.
- **Registration Engine:**
  - **Account-Free:** Players register directly without login.
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
│   ├── actions/          # Server Actions (Mutations)
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

- Node.js 18+
- PostgreSQL Database (Local or Vercel Postgres)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/henchoznoe/belouga-tournament.git
    cd belouga-tournament
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Duplicate `.env.example` to `.env` and fill in your secrets.
    ```bash
    cp .env.example .env
    ```
    *Ensure all environment variables are set before running the app.*

4.  **Database Initialization:**
    ```bash
    # Generate Prisma Client
    npm run generate

    # Push schema to DB (Dev only)
    npx prisma db push

    # Seed initial Admin user
    npx tsx prisma/seed-admin.ts
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

    Visit [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with Turbopack. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Starts the production server. |
| `npm run check` | Runs **Biome** to check for linting and formatting errors. |
| `npm run format` | Formatting fix with Biome. |
| `npm run db:deploy` | Deploys migrations and seeds database (Production). |

## 📐 Coding Conventions

This project follows strict architectural guidelines to ensure scalability:

1.  **Colocation:** UI-specific text (Labels, Titles) is colocated within components in a `CONTENT` constant.
2.  **Centralized Config:** System messages (Errors, Toasts) are stored in `lib/config/messages.ts`. routes in `routes.ts`.
3.  **Server Actions:** All mutations use the `authenticatedAction` wrapper for consistent error handling and auth checks.
4.  **Strict Typing:** `Zod` is used for all validations (Env vars, Server Actions inputs, Forms).
5.  **Separation of Concerns:** Data access (Prisma) is strictly separated from Server Actions (Controllers).

## 🔒 Security

- **Authentication:** Custom JWT implementation with secure HTTP-only cookies.
- **Middleware:** `proxy.ts` protects admin routes at the edge.
- **Validation:** All inputs are sanitized and validated via Zod schemas.

## 📄 License

This project is licensed under the MIT License.
