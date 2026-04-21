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
import { Skeleton } from '@/components/ui/skeleton'
import { getSession } from '@/lib/services/auth'
import { getGlobalSettings } from '@/lib/services/settings'
import {
  getAvailableTeams,
  getPublicTournamentBySlug,
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

const TournamentContent = async ({ params }: TournamentPageProps) => {
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
      />
    </>
  )
}

const TournamentPage = (props: TournamentPageProps) => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-4xl space-y-8">
            <Skeleton className="h-6 w-40 rounded-md bg-white/2" />
            <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
              <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
              <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
              <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
            </div>
            <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
          </div>
        }
      >
        <TournamentContent params={props.params} />
      </Suspense>
    </section>
  )
}

export default TournamentPage
