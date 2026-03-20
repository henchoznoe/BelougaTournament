/**
 * File: app/admin/tournaments/[slug]/page.tsx
 * Description: Admin tournament overview page showing status, stats and quick actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentOverview } from '@/components/features/admin/tournament-overview'
import { getTournamentBySlug } from '@/lib/services/tournaments'

interface AdminTournamentOverviewPageProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTournamentOverviewPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament ? tournament.title : 'Tournoi introuvable',
  }
}

const AdminTournamentOverviewPage = async ({
  params,
}: AdminTournamentOverviewPageProps) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return <TournamentOverview tournament={tournament} />
}

export default AdminTournamentOverviewPage
