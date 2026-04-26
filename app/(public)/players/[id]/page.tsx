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
import { PlayerProfilePrivate } from '@/components/public/players/player-profile-private'
import {
  getPlayerProfileStatus,
  getPublicPlayerProfile,
} from '@/lib/services/players'

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: PlayerPageProps): Promise<Metadata> => {
  const { id } = await params
  const status = await getPlayerProfileStatus(id)

  if (status === 'not_found') {
    return { title: 'Joueur introuvable' }
  }

  if (status === 'private') {
    return { title: 'Profil privé' }
  }

  const player = await getPublicPlayerProfile(id)

  /* v8 ignore next */
  if (!player) return { title: 'Joueur introuvable' }

  return {
    title: player.displayName,
    description: `Profil de ${player.displayName} sur Belouga.`,
  }
}

const PlayerPage = async ({ params }: PlayerPageProps) => {
  const { id } = await params
  const status = await getPlayerProfileStatus(id)

  if (status === 'not_found') {
    notFound()
  }

  if (status === 'private') {
    return (
      <section className="relative px-4 pb-20 pt-32 md:pt-40">
        <PlayerProfilePrivate />
      </section>
    )
  }

  const player = await getPublicPlayerProfile(id)

  /* v8 ignore next */
  if (!player) notFound()

  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PlayerProfile player={player} />
    </section>
  )
}

export default PlayerPage
