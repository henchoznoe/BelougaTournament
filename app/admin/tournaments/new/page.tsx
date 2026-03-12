/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Admin page for creating a new tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TournamentForm } from '@/components/features/admin/tournament-form'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'

export const metadata: Metadata = {
  title: 'Nouveau tournoi',
}

const AdminNewTournamentPage = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Plus className="size-6 text-blue-400" />
          Nouveau tournoi
        </h1>
        <p className="text-sm text-zinc-400">
          Créez un nouveau tournoi sur la plateforme.
        </p>
      </div>

      <TournamentForm />
    </div>
  )
}

export default AdminNewTournamentPage
