/**
 * File: app/admin/tournaments/[slug]/page.tsx
 * Description: Admin page for editing an existing tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Pencil } from 'lucide-react'
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Pencil className="size-6 text-blue-400" />
          Modifier le tournoi
        </h1>
        <p className="text-sm text-zinc-400">
          Modifiez les informations du tournoi{' '}
          <span className="font-medium text-zinc-200">{tournament.title}</span>.
        </p>
      </div>

      <TournamentForm tournament={tournament} />
    </div>
  )
}

export default AdminEditTournamentPage
