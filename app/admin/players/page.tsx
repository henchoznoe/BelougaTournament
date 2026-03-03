/**
 * File: app/admin/players/page.tsx
 * Description: Admin page for managing players and bans.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { PlayersList } from '@/components/features/admin/players-list'
import { getPlayers } from '@/lib/services/players'

export const metadata: Metadata = {
  title: 'Joueurs',
}

const AdminPlayersPage = async () => {
  const players = await getPlayers()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Users className="size-6 text-blue-400" />
          Joueurs
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez les joueurs inscrits sur la plateforme.
        </p>
      </div>

      <PlayersList players={players} />
    </div>
  )
}

export default AdminPlayersPage
