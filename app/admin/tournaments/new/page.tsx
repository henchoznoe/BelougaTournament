/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Page for creating a new tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

"use client";

import { TournamentForm } from "@/components/admin/tournament-form";
import { createTournamentDirect } from "@/lib/actions/tournaments";

export default function CreateTournamentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl text-white">Create Tournament</h1>
      </div>
      <TournamentForm onSubmit={async (values) => {
        await createTournamentDirect(values);
      }} />
    </div>
  );
}
