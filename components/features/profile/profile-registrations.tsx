/**
 * File: components/features/profile/profile-registrations.tsx
 * Description: Client component rendering active registrations with edit functionality.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, Gamepad2, Pencil, Swords } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { RegistrationEditDialog } from '@/components/features/profile/registration-edit-dialog'
import { ROUTES } from '@/lib/config/routes'
import type { UserRegistrationItem } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import type { RegistrationStatus } from '@/prisma/generated/prisma/enums'

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  APPROVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  REJECTED: 'border-red-500/30 bg-red-500/10 text-red-400',
  WAITLIST: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
} as const

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  WAITLIST: "Liste d'attente",
} as const

interface ProfileRegistrationsProps {
  registrations: UserRegistrationItem[]
}

export const ProfileRegistrations = ({
  registrations,
}: ProfileRegistrationsProps) => {
  const [editingRegistration, setEditingRegistration] =
    useState<UserRegistrationItem | null>(null)

  return (
    <>
      {registrations.length > 0 ? (
        <div className="space-y-2">
          {registrations.map(registration => (
            <div
              key={registration.id}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 transition-colors duration-200 hover:border-white/10 hover:bg-white/4"
            >
              <Link
                href={`${ROUTES.TOURNAMENTS}/${registration.tournament.slug}`}
                className="flex min-w-0 flex-1 flex-col gap-1"
              >
                <span className="truncate text-sm font-medium text-white">
                  {registration.tournament.title}
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {registration.tournament.game && (
                    <span className="inline-flex items-center gap-1">
                      <Gamepad2 className="size-3" />
                      {registration.tournament.game}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Swords className="size-3" />
                    {registration.tournament.format === 'SOLO'
                      ? 'Solo'
                      : 'Équipe'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(registration.tournament.startDate)}
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                    REGISTRATION_STATUS_STYLES[registration.status],
                  )}
                >
                  {REGISTRATION_STATUS_LABELS[registration.status]}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingRegistration(registration)}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  title="Modifier l'inscription"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="max-w-sm text-sm text-zinc-500">
            Vous n'êtes inscrit à aucun tournoi pour le moment.
          </p>
          <Link
            href={ROUTES.TOURNAMENTS}
            className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/10"
          >
            Voir les tournois
          </Link>
        </div>
      )}

      {editingRegistration && (
        <RegistrationEditDialog
          open={!!editingRegistration}
          onOpenChange={open => {
            if (!open) setEditingRegistration(null)
          }}
          registration={editingRegistration}
        />
      )}
    </>
  )
}
