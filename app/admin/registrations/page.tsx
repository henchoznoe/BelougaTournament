/**
 * File: app/admin/registrations/page.tsx
 * Description: Admin page displaying all tournament registrations globally.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegistrationsList } from '@/components/features/admin/registrations-list'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import {
  getAllRegistrations,
  getTeamOptions,
} from '@/lib/services/registrations'
import type { Role } from '@/prisma/generated/prisma/enums'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

export const metadata: Metadata = {
  title: 'Inscriptions',
}

const AdminRegistrationsPage = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  const registrations = await getAllRegistrations()

  // Collect unique TEAM tournament IDs for the "change team" dropdown
  const teamTournamentIds = [
    ...new Set(
      registrations
        .filter(r => r.tournament.format === TournamentFormat.TEAM)
        .map(r => r.tournament.id),
    ),
  ]

  const teamsByTournament = await getTeamOptions(teamTournamentIds)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <ClipboardList className="size-6 text-blue-400" />
          Inscriptions
        </h1>
        <p className="text-sm text-zinc-400">
          Vue globale de toutes les inscriptions aux tournois.
        </p>
      </div>

      <RegistrationsList
        registrations={registrations}
        teamsByTournament={teamsByTournament}
        viewerRole={session.user.role as Role}
      />
    </div>
  )
}

export default AdminRegistrationsPage
