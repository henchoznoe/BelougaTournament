/**
 * File: app/admin/tournaments/[slug]/layout.tsx
 * Description: Shared layout for tournament detail pages with breadcrumb, heading and tab navigation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { TournamentDetailTabs } from '@/components/features/admin/tournament-detail-tabs'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import { getTournamentBySlug } from '@/lib/services/tournaments'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTournamentLayoutProps {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

/** Async component that fetches tournament data for the heading and tabs. */
const TournamentHeader = async ({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return (
    <AdminContentLayout
      segments={[
        { label: 'Tournois', href: ROUTES.ADMIN_TOURNAMENTS },
        { label: tournament.title },
      ]}
      icon={Trophy}
      title={tournament.title}
      titleExtra={<TournamentStatusBadge status={tournament.status} />}
      subtitle="Gérez les détails, inscriptions et équipes de ce tournoi."
    >
      {/* Tab navigation */}
      <TournamentDetailTabs
        slug={slug}
        showTeamsTab={tournament.format === TournamentFormat.TEAM}
      />

      {/* Page content */}
      {children}
    </AdminContentLayout>
  )
}

const AdminTournamentLayout = ({
  params,
  children,
}: AdminTournamentLayoutProps) => {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-4 w-48 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-72 rounded-xl" />
        </div>
      }
    >
      <TournamentHeader params={params}>{children}</TournamentHeader>
    </Suspense>
  )
}

export default AdminTournamentLayout
