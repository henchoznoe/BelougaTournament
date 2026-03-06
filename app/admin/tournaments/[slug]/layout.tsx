/**
 * File: app/admin/tournaments/[slug]/layout.tsx
 * Description: Shared layout for tournament detail pages with heading and tab navigation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { TournamentDetailTabs } from '@/components/features/admin/tournament-detail-tabs'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getTournamentBySlug } from '@/lib/services/tournaments'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTournamentLayoutProps {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

/** Async component that fetches tournament data for the heading and tabs. */
const TournamentHeader = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return (
    <>
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Trophy className="size-6 text-blue-400" />
          {tournament.title}
          <TournamentStatusBadge status={tournament.status} />
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez les détails, inscriptions et équipes de ce tournoi.
        </p>
      </div>

      {/* Tab navigation */}
      <TournamentDetailTabs
        slug={slug}
        showTeamsTab={tournament.format === TournamentFormat.TEAM}
      />
    </>
  )
}

const AdminTournamentLayout = ({
  params,
  children,
}: AdminTournamentLayoutProps) => {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-72 rounded-xl" />
          </div>
        }
      >
        <TournamentHeader params={params} />
      </Suspense>

      {/* Page content */}
      {children}
    </div>
  )
}

export default AdminTournamentLayout
