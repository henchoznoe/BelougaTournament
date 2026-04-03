/**
 * File: app/admin/tournaments/[slug]/teams/[teamId]/page.tsx
 * Description: Admin page for viewing and managing a single team within a tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TeamDetail } from '@/components/features/admin/team-detail'
import { getTeamById, getTournamentBySlug } from '@/lib/services/tournaments'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTeamDetailPageProps {
  params: Promise<{ slug: string; teamId: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTeamDetailPageProps): Promise<Metadata> => {
  const { teamId } = await params
  const team = await getTeamById(teamId)
  return {
    title: team ? `Equipe — ${team.name}` : 'Equipe introuvable',
  }
}

const AdminTeamDetailPage = async ({ params }: AdminTeamDetailPageProps) => {
  const { slug, teamId } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament || tournament.format !== TournamentFormat.TEAM) {
    notFound()
  }

  const team = await getTeamById(teamId)

  if (!team) {
    notFound()
  }

  return <TeamDetail team={team} tournamentId={tournament.id} slug={slug} />
}

export default AdminTeamDetailPage
