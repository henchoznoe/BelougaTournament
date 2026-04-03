/**
 * File: app/admin/tournaments/page.tsx
 * Description: Admin page for listing and managing tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import { TournamentsList } from '@/components/features/admin/tournaments-list'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getTournaments } from '@/lib/services/tournaments'

export const metadata: Metadata = {
  title: 'Tournois',
}

const AdminTournamentsPage = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  const tournaments = await getTournaments()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb segments={[{ label: 'Tournois' }]} />

      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Trophy className="size-6 text-blue-400" />
          Tournois
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez les tournois de la plateforme.
        </p>
      </div>

      <TournamentsList tournaments={tournaments} />
    </div>
  )
}

export default AdminTournamentsPage
