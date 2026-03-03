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
import { getPublicTournamentBySlug } from '@/lib/services/tournaments'

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
  const tournament = await getPublicTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={tournament.title}
        description={tournament.game ?? undefined}
      />
      <TournamentDetail tournament={tournament} />
    </>
  )
}

const TournamentPage = (props: TournamentPageProps) => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl space-y-6">
            <Skeleton className="mx-auto h-16 w-64 rounded-xl" />
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
