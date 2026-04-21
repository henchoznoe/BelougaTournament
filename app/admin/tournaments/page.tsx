/**
 * File: app/admin/tournaments/page.tsx
 * Description: Admin page for listing and managing tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { TournamentsList } from '@/components/admin/tournaments/tournaments-list'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { getTournaments } from '@/lib/services/tournaments-admin'

export const metadata: Metadata = {
  title: 'Tournois',
}

const AdminTournamentsPage = async () => {
  const tournaments = await getTournaments()

  return (
    <AdminContentLayout
      segments={[{ label: 'Tournois' }]}
      icon={Trophy}
      title="Tournois"
      subtitle="Gérez les tournois de la plateforme."
    >
      <TournamentsList tournaments={tournaments} />
    </AdminContentLayout>
  )
}

export default AdminTournamentsPage
