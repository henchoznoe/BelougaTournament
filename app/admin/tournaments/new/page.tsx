/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Admin page for creating a new tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { TournamentForm } from '@/components/admin/forms/tournament-form'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'

export const metadata: Metadata = {
  title: 'Nouveau tournoi',
}

const AdminNewTournamentPage = async () => {
  return (
    <AdminContentLayout
      segments={[
        { label: 'Tournois', href: ROUTES.ADMIN_TOURNAMENTS },
        { label: 'Nouveau tournoi' },
      ]}
      icon={Plus}
      title="Nouveau tournoi"
      subtitle="Créez un nouveau tournoi sur la plateforme."
    >
      <TournamentForm key="new" />
    </AdminContentLayout>
  )
}

export default AdminNewTournamentPage
