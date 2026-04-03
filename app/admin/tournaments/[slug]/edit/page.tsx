/**
 * File: app/admin/tournaments/[slug]/edit/page.tsx
 * Description: Admin page for editing an existing tournament (tab within tournament detail layout).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentForm } from '@/components/features/admin/tournament-form'
import { getTournamentBySlug } from '@/lib/services/tournaments'

interface AdminEditTournamentPageProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: AdminEditTournamentPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament ? `Modifier ${tournament.title}` : 'Tournoi introuvable',
  }
}

const AdminEditTournamentPage = async ({
  params,
}: AdminEditTournamentPageProps) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return <TournamentForm tournament={tournament} />
}

export default AdminEditTournamentPage
