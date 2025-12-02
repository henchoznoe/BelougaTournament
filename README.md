# Belouga Tournament

## 📝 Description

"Belouga Tournament" is a tournament management platform designed for a gaming community. This project is a complete rewrite and migration of a legacy React/PHP application to a modern **Next.js 16** stack.

The goal is to allow an administrator to manage video game tournaments (creation, custom registration fields, brackets) and allow players to register dynamically (solo or team) without creating an account.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** PostgreSQL (Supabase via Vercel Postgres)
- **ORM:** [Prisma](https://www.prisma.io/) (v6+)
- **UI Library:** [shadcn/ui](https://ui.shadcn.com/) (Zinc theme, Dark mode default)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Linting/Formatting:** [Biome](https://biomejs.dev/)
- **Data Fetching/Mutation:** React Server Components (RSC) & Server Actions

## ✨ Features

### Public Interface
- **Landing Page:** Hero section highlighting the next tournament, embedded Twitch stream (`quentadoulive`), and a grid of upcoming/ongoing tournaments.
- **Tournament Details:** Comprehensive view with dates, format, cashprize, rules, and a **Challonge** bracket embed.
- **Dynamic Registration Engine:**
  - Forms are generated on-the-fly based on admin-defined fields (e.g., "Riot ID", "Rank").
  - Support for **Solo** and **Team** (Duo/Squad) registrations in a single flow.
  - Verification of registration windows (Open/Closed) and capacity limits.
- **Archives:** Access to past tournament results.

### Admin Dashboard (Back-office)
- **Secure Login:** Admin authentication.
- **Tournament Management (CRUD):**
  - Create/Edit tournaments with specific settings (Slug, Dates, Format, Team Size).
  - **Dynamic Field Builder:** Define custom questions for players (Text, Number, Select) required for registration.
  - Embed Challonge brackets.
  - Archive tournaments.
- **Registration Management:**
  - View full list of registrants (Teams & Players).
  - Export data (CSV/Excel).
  - Moderation (Delete/Edit entries).
- **Settings:** Update global site assets (Logo, etc.).

## 🗄️ Database Architecture (Prisma)

The database allows for high flexibility regarding the types of games hosted (FPS, Racing, Chess, etc.) thanks to a dynamic field system.

* **User:** Admins (`id`, `email`, `role`).
* **Tournament:** Core event data (`slug`, `dates`, `format`, `streamUrl`, `challongeId`).
* **TournamentField:** Definitions of questions asked during registration (`label`, `type`, `required`).
* **Registration:** Represents an entry (Team or Individual).
* **Player:** Actual participants linked to a registration.
* **PlayerData:** Answers to the dynamic `TournamentFields`.

## 🛠️ Getting Started

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
    Create a `.env` file with your Vercel Postgres credentials:
    ```env
    DATABASE_URL="postgres://..."
    DIRECT_URL="postgres://..."
    ```

4.  **Database Setup:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.