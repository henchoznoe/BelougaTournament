/**
 * File: components/public/profile/profile-registrations.tsx
 * Description: Client component rendering active registrations with edit and unregister functionality.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  BadgeCheck,
  Calendar,
  CreditCard,
  Gamepad2,
  Loader2,
  Pencil,
  Swords,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { RegistrationEditDialog } from '@/components/public/profile/registration-edit-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { unregisterFromTournament } from '@/lib/actions/tournament-unregistration'
import { ROUTES } from '@/lib/config/routes'
import type { UserRegistrationItem } from '@/lib/types/tournament'
import { formatCentimes, formatDate } from '@/lib/utils/formatting'
import { isRefundEligible } from '@/lib/utils/tournament-helpers'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface ProfileRegistrationsProps {
  registrations: UserRegistrationItem[]
  userId: string
}

export const ProfileRegistrations = ({
  registrations,
  userId,
}: ProfileRegistrationsProps) => {
  const [editingRegistration, setEditingRegistration] =
    useState<UserRegistrationItem | null>(null)
  const [unregisterTarget, setUnregisterTarget] =
    useState<UserRegistrationItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUnregister = () => {
    if (!unregisterTarget) return

    startTransition(async () => {
      const result = await unregisterFromTournament({
        tournamentId: unregisterTarget.tournament.id,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
        setUnregisterTarget(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      {registrations.length > 0 ? (
        <div className="space-y-2">
          {registrations.map(registration => (
            <div key={registration.id} className="space-y-2">
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 transition-colors duration-200 hover:border-white/10 hover:bg-white/4">
                <Link
                  href={`${ROUTES.TOURNAMENTS}/${registration.tournament.slug}`}
                  className="flex min-w-0 flex-1 flex-col gap-1"
                >
                  <span className="truncate text-sm font-medium text-white">
                    {registration.tournament.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {registration.tournament.games.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Gamepad2 className="size-3" />
                        {registration.tournament.games.join(', ')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Swords className="size-3" />
                      {registration.tournament.format === TournamentFormat.SOLO
                        ? 'Solo'
                        : 'Équipe'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(registration.tournament.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-zinc-400">
                      <BadgeCheck className="size-3" />
                      {registration.status === RegistrationStatus.CONFIRMED
                        ? 'Inscription confirmée'
                        : registration.status === RegistrationStatus.PENDING
                          ? 'Inscription en attente'
                          : registration.status === RegistrationStatus.CANCELLED
                            ? 'Inscription annulée'
                            : 'Inscription expirée'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-zinc-400">
                      <CreditCard className="size-3" />
                      {registration.paymentStatus === PaymentStatus.PAID
                        ? 'Paiement validé'
                        : registration.paymentStatus === PaymentStatus.REFUNDED
                          ? 'Paiement remboursé'
                          : registration.paymentStatus === PaymentStatus.PENDING
                            ? 'Paiement en attente'
                            : registration.paymentStatus ===
                                PaymentStatus.FAILED
                              ? 'Paiement échoué'
                              : registration.paymentStatus ===
                                  PaymentStatus.CANCELLED
                                ? 'Paiement annulé'
                                : 'Tournoi gratuit'}
                    </span>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRegistration(registration)}
                    disabled={
                      registration.status !== RegistrationStatus.CONFIRMED
                    }
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                    aria-label="Modifier l'inscription"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnregisterTarget(registration)}
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Se désinscrire"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
              {registration.status === RegistrationStatus.PENDING && (
                <p className="px-1 text-xs text-amber-300">
                  Paiement Stripe en attente. Si vous venez de payer, le webhook
                  n'a peut-être pas encore confirmé votre inscription.
                </p>
              )}
              {registration.paymentStatus === PaymentStatus.REFUNDED && (
                <p className="px-1 text-xs text-emerald-300">
                  Cette inscription a été remboursée et n'est plus active.
                </p>
              )}
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
          userId={userId}
        />
      )}

      <AlertDialog
        open={!!unregisterTarget}
        onOpenChange={open => {
          if (!open) setUnregisterTarget(null)
        }}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirmer la désinscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Voulez-vous vraiment annuler votre inscription au tournoi{' '}
              <span className="font-semibold text-white">
                {unregisterTarget?.tournament.title}
              </span>
              &nbsp;?
              {unregisterTarget?.tournament.format ===
                TournamentFormat.TEAM && (
                <span className="mt-2 block text-amber-400">
                  Si vous êtes le dernier membre de votre équipe, celle-ci sera
                  dissoute.
                </span>
              )}
              {unregisterTarget?.paymentRequiredSnapshot &&
                unregisterTarget.paymentStatus === PaymentStatus.PAID &&
                (() => {
                  const tournament = unregisterTarget.tournament
                  const eligible = isRefundEligible(
                    new Date(tournament.startDate),
                    tournament.refundPolicyType,
                    tournament.refundDeadlineDays,
                    new Date(),
                  )
                  const amount =
                    tournament.entryFeeAmount !== null
                      ? formatCentimes(
                          tournament.entryFeeAmount,
                          tournament.entryFeeCurrency ?? 'CHF',
                        )
                      : null
                  return eligible ? (
                    <span className="mt-2 block text-emerald-400">
                      Vous serez remboursé de {amount}.
                    </span>
                  ) : (
                    <span className="mt-2 block text-red-400">
                      Attention : vous ne serez pas remboursé.
                    </span>
                  )
                })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnregister}
              disabled={isPending}
              className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Se désinscrire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
