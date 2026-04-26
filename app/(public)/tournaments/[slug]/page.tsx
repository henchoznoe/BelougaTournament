/**
 * File: app/(public)/tournaments/[slug]/page.tsx
 * Description: Public tournament detail page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { StripeReturnToast } from '@/components/public/tournaments/stripe-return-toast'
import { TournamentDetail } from '@/components/public/tournaments/tournament-detail'
import { getSession } from '@/lib/services/auth'
import { getGlobalSettings } from '@/lib/services/settings'
import {
  getAvailableTeams,
  getPublicTournamentBySlug,
  getTournamentRegistrants,
  getTournamentTeamRegistrants,
} from '@/lib/services/tournaments-public'
import { getUserTournamentRegistrationState } from '@/lib/services/tournaments-user'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
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
  const [tournament, settings, session] = await Promise.all([
    getPublicTournamentBySlug(slug),
    getGlobalSettings(),
    getSession(),
  ])

  if (!tournament) {
    notFound()
  }

  // Fetch available teams for TEAM format tournaments
  const availableTeams =
    tournament.format === TournamentFormat.TEAM
      ? await getAvailableTeams(tournament.id)
      : []

  // Check if the logged-in user is already registered for this tournament
  const isRegistered = session?.user
    ? await getUserTournamentRegistrationState(session.user.id, tournament.id)
    : null

  // Fetch registrants if the tournament has showRegistrants enabled
  const registrants = tournament.showRegistrants
    ? tournament.format === TournamentFormat.TEAM
      ? []
      : await getTournamentRegistrants(tournament.id)
    : []
  const teamRegistrants =
    tournament.showRegistrants && tournament.format === TournamentFormat.TEAM
      ? await getTournamentTeamRegistrants(tournament.id)
      : []

  return (
    <>
      <Suspense fallback={null}>
        <StripeReturnToast tournamentId={tournament.id} />
      </Suspense>
      <TournamentDetail
        tournament={tournament}
        twitchUsername={settings.twitchUsername ?? undefined}
        availableTeams={availableTeams}
        registrationState={isRegistered}
        isAuthenticated={!!session?.user}
        registrants={registrants}
        teamRegistrants={teamRegistrants}
      />
    </>
  )
}

export default TournamentPage
