/**
 * File: app/admin/registrations/[id]/page.tsx
 * Description: Admin page for viewing and managing a single registration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { RegistrationDetail } from '@/components/features/admin/registration-detail'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import {
  getRegistrationById,
  getTeamOptions,
} from '@/lib/services/registrations'
import type { Role } from '@/prisma/generated/prisma/enums'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminRegistrationDetailPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminRegistrationDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const registration = await getRegistrationById(id)
  return {
    title: registration
      ? `Inscription — ${registration.user.displayName}`
      : 'Inscription introuvable',
  }
}

const AdminRegistrationDetailPage = async ({
  params,
}: AdminRegistrationDetailPageProps) => {
  const { id } = await params
  const session = await getSession()
  const registration = await getRegistrationById(id)

  if (!registration) {
    notFound()
  }

  // Fetch team options for the "change team" dropdown (only for TEAM tournaments)
  const teamsByTournament =
    registration.tournament.format === TournamentFormat.TEAM
      ? await getTeamOptions([registration.tournament.id])
      : {}

  return (
    <AdminContentLayout
      segments={[
        { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD },
        { label: registration.user.displayName },
      ]}
      icon={ClipboardList}
      title="Inscription"
      subtitle={`Détails de l'inscription de ${registration.user.displayName} au tournoi ${registration.tournament.title}.`}
    >
      <RegistrationDetail
        registration={registration}
        teamsByTournament={teamsByTournament}
        viewerRole={session?.user.role as Role}
      />
    </AdminContentLayout>
  )
}

export default AdminRegistrationDetailPage
