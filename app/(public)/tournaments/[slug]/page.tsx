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
import { TournamentDetail } from '@/components/features/tournaments/tournament-detail'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getSession } from '@/lib/services/auth'
import { getGlobalSettings } from '@/lib/services/settings'
import {
  getAvailableTeams,
  getPublicTournamentBySlug,
  getUserTournamentRegistrationState,
} from '@/lib/services/tournaments'
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
      <PageHeader
        title={tournament.title}
        description={tournament.game ?? undefined}
      />
      <TournamentDetail
        tournament={tournament}
        twitchUsername={settings.twitchUsername ?? undefined}
        availableTeams={availableTeams}
        registrationState={isRegistered}
      />
    </>
  )
}

const TournamentPage = (props: TournamentPageProps) => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl space-y-6">
            <div className="mb-16 flex flex-col items-center gap-3">
              <Skeleton className="h-10 w-56 rounded-lg md:h-12 md:w-72 bg-white/2" />
              <Skeleton className="h-5 w-32 rounded-md bg-white/2" />
            </div>
            <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-40 rounded-3xl border border-white/5 bg-white/2" />
          </div>
        }
      >
        <TournamentContent params={props.params} />
      </Suspense>
    </section>
  )
}

export default TournamentPage
