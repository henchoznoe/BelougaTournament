/**
 * File: app/admin/tournaments/[slug]/page.tsx
 * Description: Admin page for viewing tournament details with tabs (overview, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { TournamentOverview } from '@/components/admin/tournaments/tournament-detail'
import {
  TournamentDetailActions,
  TournamentStatusControl,
} from '@/components/admin/tournaments/tournament-detail-actions'
import { TournamentRegistrations } from '@/components/admin/tournaments/tournament-registrations'
import type { TournamentTab } from '@/components/admin/tournaments/tournament-tabs'
import { TournamentTabNav } from '@/components/admin/tournaments/tournament-tabs'
import { TournamentTeams } from '@/components/admin/tournaments/tournament-teams'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'
import {
  getRegistrations,
  getTeams,
  getTournamentBySlug,
} from '@/lib/services/tournaments-admin'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTournamentDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTournamentDetailPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament ? tournament.title : 'Tournoi introuvable',
  }
}

const AdminTournamentDetailPage = async ({
  params,
  searchParams,
}: AdminTournamentDetailPageProps) => {
  const { slug } = await params
  const { tab } = await searchParams

  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  const activeTab: TournamentTab =
    tab === 'registrations' || tab === 'teams' ? tab : 'overview'
  const isTeam = tournament.format === TournamentFormat.TEAM

  // Fetch data based on active tab to avoid unnecessary queries
  const registrations =
    activeTab === 'registrations' || activeTab === 'teams'
      ? await getRegistrations(tournament.id)
      : []
  const teams =
    isTeam && (activeTab === 'registrations' || activeTab === 'teams')
      ? await getTeams(tournament.id)
      : []

  return (
    <AdminContentLayout
      segments={[
        { label: 'Tournois', href: ROUTES.ADMIN_TOURNAMENTS },
        { label: tournament.title },
      ]}
      icon={Trophy}
      title={tournament.title}
      titleExtra={<TournamentStatusControl tournament={tournament} />}
      headerRight={<TournamentDetailActions tournament={tournament} />}
    >
      <Suspense>
        <TournamentTabNav format={tournament.format} />
      </Suspense>

      {activeTab === 'overview' && (
        <TournamentOverview tournament={tournament} />
      )}

      {activeTab === 'registrations' && (
        <TournamentRegistrations
          tournament={tournament}
          registrations={registrations}
          teams={teams}
        />
      )}

      {activeTab === 'teams' && isTeam && (
        <TournamentTeams tournament={tournament} teams={teams} />
      )}
    </AdminContentLayout>
  )
}

export default AdminTournamentDetailPage
