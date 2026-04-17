/**
 * File: components/features/profile/profile-tournament-history.tsx
 * Description: Server Component displaying the user's past tournament registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  Calendar,
  ChevronLeft,
  CreditCard,
  Gamepad2,
  Swords,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getUserPastRegistrations } from '@/lib/services/tournaments'
import type { UserRegistrationItem } from '@/lib/types/tournament'
import { formatDate } from '@/lib/utils/formatting'
import {
  PaymentStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

/** Renders a single past registration row as a link to the tournament detail page. */
const RegistrationRow = ({
  registration,
}: {
  registration: UserRegistrationItem
}) => {
  const { tournament } = registration

  return (
    <Link
      href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}
      className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 transition-colors duration-200 hover:border-white/10 hover:bg-white/4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-white">
          {tournament.title}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {tournament.game && (
            <span className="inline-flex items-center gap-1">
              <Gamepad2 className="size-3" />
              {tournament.game}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Swords className="size-3" />
            {tournament.format === TournamentFormat.SOLO ? 'Solo' : 'Équipe'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDate(tournament.startDate)}
          </span>
        </div>
      </div>
      {registration.paymentStatus === PaymentStatus.REFUNDED ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300">
          <CreditCard className="size-3" />
          Remboursé
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          Participé
        </span>
      )}
    </Link>
  )
}

export const ProfileTournamentHistory = async () => {
  const session = await getSession()

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  const pastRegistrations = await getUserPastRegistrations(session.user.id)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.PROFILE}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ChevronLeft className="size-4" />
        Retour au profil
      </Link>

      {/* Tournament history list */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="relative z-10">
          <div className="mb-4">
            <p className="text-xs text-zinc-500">
              {pastRegistrations.length > 0
                ? `${pastRegistrations.length} participation${pastRegistrations.length > 1 ? 's' : ''}`
                : 'Aucun historique'}
            </p>
          </div>

          {pastRegistrations.length > 0 ? (
            <div className="space-y-2">
              {pastRegistrations.map(registration => (
                <RegistrationRow
                  key={registration.id}
                  registration={registration}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="max-w-sm text-sm text-zinc-500">
                Aucune participation passée à afficher pour le moment.
              </p>
              <Link
                href={ROUTES.TOURNAMENTS}
                className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/10"
              >
                Voir les tournois
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
