/**
 * File: app/(public)/players/[id]/page.tsx
 * Description: Public player profile page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlayerProfile } from '@/components/public/players/player-profile'
import { getPublicPlayerProfile } from '@/lib/services/players'

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: PlayerPageProps): Promise<Metadata> => {
  const { id } = await params
  const player = await getPublicPlayerProfile(id)

  if (!player) {
    return { title: 'Joueur introuvable' }
  }

  return {
    title: player.displayName,
    description: `Profil de ${player.displayName} sur Belouga.`,
  }
}

const PlayerPage = async ({ params }: PlayerPageProps) => {
  const { id } = await params
  const player = await getPublicPlayerProfile(id)

  if (!player) {
    notFound()
  }

  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PlayerProfile player={player} />
    </section>
  )
}

export default PlayerPage
