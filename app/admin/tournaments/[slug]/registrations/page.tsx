/**
 * File: app/admin/tournaments/[slug]/registrations/page.tsx
 * Description: Admin page displaying tournament registrations (tab within tournament detail layout).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { TournamentRegistrationsList } from '@/components/features/admin/tournament-registrations-list'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getTeamOptions } from '@/lib/services/registrations'
import {
  getRegistrations,
  getTournamentBySlug,
} from '@/lib/services/tournaments'
import type { Role } from '@/prisma/generated/prisma/enums'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface AdminTournamentRegistrationsPageProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTournamentRegistrationsPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament
      ? `Inscriptions — ${tournament.title}`
      : 'Tournoi introuvable',
  }
}

const AdminTournamentRegistrationsPage = async ({
  params,
}: AdminTournamentRegistrationsPageProps) => {
  const { slug } = await params
  const [session, tournament] = await Promise.all([
    getSession(),
    getTournamentBySlug(slug),
  ])

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  if (!tournament) {
    notFound()
  }

  const registrations = await getRegistrations(tournament.id)

  // Fetch team options for the "change team" dropdown (only for TEAM tournaments)
  const teamsByTournament =
    tournament.format === TournamentFormat.TEAM
      ? await getTeamOptions([tournament.id])
      : {}

  // Tournament context needed by the RegistrationDetailDialog
  const tournamentContext = {
    id: tournament.id,
    title: tournament.title,
    slug: tournament.slug,
    format: tournament.format,
    status: tournament.status,
    fields: tournament.fields.map(f => ({
      label: f.label,
      type: f.type,
      required: f.required,
      order: f.order,
    })),
  }

  return (
    <TournamentRegistrationsList
      registrations={registrations}
      tournamentId={tournament.id}
      tournamentContext={tournamentContext}
      teamsByTournament={teamsByTournament}
      viewerRole={session.user.role as Role}
    />
  )
}

export default AdminTournamentRegistrationsPage
