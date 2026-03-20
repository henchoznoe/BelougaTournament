/**
 * File: app/admin/tournaments/[slug]/registrations/page.tsx
 * Description: Admin page displaying tournament registrations (tab within tournament detail layout).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentRegistrationsList } from '@/components/features/admin/tournament-registrations-list'
import {
  getRegistrations,
  getTournamentBySlug,
} from '@/lib/services/tournaments'

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
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  const registrations = await getRegistrations(tournament.id)

  return (
    <TournamentRegistrationsList
      registrations={registrations}
      tournamentId={tournament.id}
    />
  )
}

export default AdminTournamentRegistrationsPage
