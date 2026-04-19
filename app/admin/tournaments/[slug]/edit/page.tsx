/**
 * File: app/admin/tournaments/[slug]/edit/page.tsx
 * Description: Admin page for editing an existing tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Pencil } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentForm } from '@/components/admin/tournaments/form/tournament-form'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'
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
    <AdminContentLayout
      segments={[
        { label: 'Tournois', href: ROUTES.ADMIN_TOURNAMENTS },
        {
          label: tournament.title,
          href: ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug),
        },
        { label: 'Modifier' },
      ]}
      icon={Pencil}
      title={`Modifier ${tournament.title}`}
      subtitle="Modifiez les informations du tournoi."
    >
      <TournamentForm key={tournament.slug} tournament={tournament} />
    </AdminContentLayout>
  )
}

export default AdminEditTournamentPage
