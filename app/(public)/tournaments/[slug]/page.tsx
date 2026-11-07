/**
 * File: app/(public)/tournaments/[slug]/page.tsx
 * Description: Public tournament detail page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentDetail } from '@/components/public/tournaments/tournament-detail'
import { getGlobalSettings } from '@/lib/services/settings'
import { getTournamentSitemapEntries } from '@/lib/services/sitemap'
import {
  getAvailableTeams,
  getPublicTournamentBySlug,
  getTournamentRegistrants,
  getTournamentTeamRegistrants,
} from '@/lib/services/tournaments-public'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
}

export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  const tournaments = await getTournamentSitemapEntries()
  return tournaments.length > 0
    ? tournaments.map(({ slug }) => ({ slug }))
    : [{ slug: '__no-tournaments__' }]
}

export const generateMetadata = async ({
  params,
}: TournamentPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getPublicTournamentBySlug(slug)

  if (!tournament) {
    return { title: 'Tournoi introuvable' }
  }

  return {
    title: tournament.title,
    description:
      tournament.description || `Détails du tournoi ${tournament.title}.`,
  }
}

const TournamentPage = async ({ params }: TournamentPageProps) => {
  const { slug } = await params
  const [tournament, settings] = await Promise.all([
    getPublicTournamentBySlug(slug),
    getGlobalSettings(),
  ])

  if (!tournament) {
    notFound()
  }

  const [availableTeams, registrants, teamRegistrants] = await Promise.all([
    tournament.format === TournamentFormat.TEAM
      ? getAvailableTeams(tournament.id)
      : Promise.resolve([]),
    tournament.showRegistrants && tournament.format === TournamentFormat.SOLO
      ? getTournamentRegistrants(tournament.id)
      : Promise.resolve([]),
    tournament.showRegistrants && tournament.format === TournamentFormat.TEAM
      ? getTournamentTeamRegistrants(tournament.id)
      : Promise.resolve([]),
  ])

  return (
    <TournamentDetail
      tournament={tournament}
      twitchUsername={settings.twitchUsername ?? undefined}
      availableTeams={availableTeams}
      registrants={registrants}
      teamRegistrants={teamRegistrants}
    />
  )
}

export default TournamentPage
