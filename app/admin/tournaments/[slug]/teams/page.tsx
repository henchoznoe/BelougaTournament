/**
 * File: app/admin/tournaments/[slug]/teams/page.tsx
 * Description: Admin page displaying tournament teams (tab within tournament detail layout).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentTeamsList } from '@/components/features/admin/tournament-teams-list'
import { getTeams, getTournamentBySlug } from '@/lib/services/tournaments'

interface AdminTournamentTeamsPageProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTournamentTeamsPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament ? `Equipes — ${tournament.title}` : 'Tournoi introuvable',
  }
}

const AdminTournamentTeamsPage = async ({
  params,
}: AdminTournamentTeamsPageProps) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  const teams = await getTeams(tournament.id)

  return <TournamentTeamsList teams={teams} tournamentId={tournament.id} />
}

export default AdminTournamentTeamsPage
