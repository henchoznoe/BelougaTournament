/**
 * File: app/admin/tournaments/page.tsx
 * Description: Admin page for listing and managing tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { TournamentsList } from '@/components/features/admin/tournaments-list'
import { getTournaments } from '@/lib/services/tournaments'

export const metadata: Metadata = {
  title: 'Tournois',
}

const AdminTournamentsPage = async () => {
  const tournaments = await getTournaments()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Trophy className="size-6 text-blue-400" />
          Tournois
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez les tournois de la plateforme.
        </p>
      </div>

      <TournamentsList tournaments={tournaments} />
    </div>
  )
}

export default AdminTournamentsPage
