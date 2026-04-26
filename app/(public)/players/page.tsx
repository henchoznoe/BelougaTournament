/**
 * File: app/(public)/players/page.tsx
 * Description: Public players list page showing users with public profiles.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { PlayersList } from '@/components/public/players/players-list'
import { PageHeader } from '@/components/ui/page-header'
import { getPublicPlayers } from '@/lib/services/players'

export const metadata: Metadata = {
  title: 'Joueurs',
  description: 'Découvrez les membres de la communauté Belouga.',
}

const PlayersPage = async () => {
  const players = await getPublicPlayers()

  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Joueurs"
        description="Découvrez les membres de la communauté."
      />
      <PlayersList players={players} />
    </section>
  )
}

export default PlayersPage
