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
import { TournamentArchivedToast } from '@/components/admin/tournaments/tournament-archived-toast'
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
import { AdminPageSkeleton } from '@/components/admin/ui/admin-page-skeleton'
import { ROUTES } from '@/lib/config/routes'
import {
  getRegistrations,
  getTeams,
  getTournamentBySlug,
} from '@/lib/services/tournaments-admin'
import type { TournamentDetail } from '@/lib/types/tournament'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTournamentDetailPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string; archived?: string }>
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
        <TournamentArchivedToast />
      </Suspense>
      <Suspense>
        <TournamentTabNav format={tournament.format} />
      </Suspense>

      <Suspense
        key={activeTab}
        fallback={<AdminPageSkeleton variant="detail" />}
      >
        <TournamentTabContent tournament={tournament} activeTab={activeTab} />
      </Suspense>
    </AdminContentLayout>
  )
}

const TournamentTabContent = async ({
  tournament,
  activeTab,
}: {
  tournament: TournamentDetail
  activeTab: TournamentTab
}) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const needsParticipants =
    activeTab === 'registrations' || activeTab === 'teams'
  const [registrations, teams] = await Promise.all([
    needsParticipants ? getRegistrations(tournament.id) : Promise.resolve([]),
    isTeam && needsParticipants ? getTeams(tournament.id) : Promise.resolve([]),
  ])
  return (
    <>
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
    </>
  )
}

export default AdminTournamentDetailPage
