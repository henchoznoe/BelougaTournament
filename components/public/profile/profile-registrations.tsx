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
  Gift,
  Loader2,
  Pencil,
  Swords,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { RegistrationEditDialog } from '@/components/public/profile/registration-edit-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { unregisterFromTournament } from '@/lib/actions/tournament-unregistration'
import { ROUTES } from '@/lib/config/routes'
import type { UserRegistrationItem } from '@/lib/types/tournament'
import {
  calculateStripeNetAmount,
  formatCentimes,
  formatDate,
} from '@/lib/utils/formatting'
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

  const handleUnregister = (waiveRefund: boolean) => {
    if (!unregisterTarget) return

    startTransition(async () => {
      const result = await unregisterFromTournament({
        tournamentId: unregisterTarget.tournament.id,
        waiveRefund,
      })

      if (result.success) {
        posthog.capture('tournament_unregistration_confirmed', {
          tournament_id: unregisterTarget.tournament.id,
          format: unregisterTarget.tournament.format,
          waive_refund: waiveRefund,
          refund_eligible: refundInfo.eligible,
        })
        toast.success(result.message)
        router.refresh()
        setUnregisterTarget(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  // Compute refund eligibility and net amount for the current unregister target
  const getRefundInfo = (registration: UserRegistrationItem) => {
    if (
      !registration.paymentRequiredSnapshot ||
      registration.paymentStatus !== PaymentStatus.PAID
    ) {
      return { eligible: false, amount: null }
    }
    const tournament = registration.tournament
    const eligible = isRefundEligible(
      new Date(tournament.startDate),
      tournament.refundPolicyType,
      tournament.refundDeadlineDays,
      new Date(),
    )
    const amount =
      tournament.entryFeeAmount !== null
        ? formatCentimes(
            calculateStripeNetAmount(tournament.entryFeeAmount),
            tournament.entryFeeCurrency ?? 'CHF',
          )
        : null
    return { eligible, amount }
  }

  const refundInfo = unregisterTarget
    ? getRefundInfo(unregisterTarget)
    : { eligible: false, amount: null }

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
                          : registration.paymentStatus ===
                              PaymentStatus.FORFEITED
                            ? 'Frais offerts'
                            : registration.paymentStatus ===
                                PaymentStatus.PENDING
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
              {registration.paymentStatus === PaymentStatus.FORFEITED && (
                <p className="px-1 text-xs text-orange-300">
                  Vous avez offert vos frais d&apos;inscription au Belouga
                  Tournament. Merci pour votre soutien&nbsp;!
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

      {/* Unregister dialog — two-action variant when refund is eligible */}
      <Dialog
        open={!!unregisterTarget}
        onOpenChange={open => {
          if (!open) setUnregisterTarget(null)
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Confirmer la désinscription
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
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
            </DialogDescription>
          </DialogHeader>

          {refundInfo.eligible ? (
            /* ── Refund window open: two explicit choices ─────────────── */
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Vous êtes dans la fenêtre de remboursement. Choisissez comment
                procéder&nbsp;:
              </p>
              <div className="space-y-2">
                {/* Option 1 — refund */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleUnregister(false)}
                  className="flex w-full items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-left transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-emerald-400" />
                  ) : (
                    <CreditCard className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      Me désinscrire et être remboursé
                    </p>
                    <p className="text-xs text-zinc-500">
                      Vous recevrez{' '}
                      <span className="font-medium text-zinc-300">
                        {refundInfo.amount}
                      </span>{' '}
                      (frais Stripe déduits).
                    </p>
                  </div>
                </button>

                {/* Option 2 — forfeit */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleUnregister(true)}
                  className="flex w-full items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-left transition-colors hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-orange-400" />
                  ) : (
                    <Gift className="mt-0.5 size-4 shrink-0 text-orange-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-orange-400">
                      Me désinscrire sans remboursement
                    </p>
                    <p className="text-xs text-zinc-500">
                      Vos frais d&apos;inscription sont offerts au Belouga
                      Tournament. Cette action est irréversible.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* ── No refund window: single destructive confirm ─────────── */
            <>
              {unregisterTarget?.paymentRequiredSnapshot &&
                unregisterTarget.paymentStatus === PaymentStatus.PAID && (
                  <p className="text-sm text-red-400">
                    Attention&nbsp;: vous ne serez pas remboursé.
                  </p>
                )}
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setUnregisterTarget(null)}
                  className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => handleUnregister(false)}
                  className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Se désinscrire
                </Button>
              </DialogFooter>
            </>
          )}

          {refundInfo.eligible && (
            <DialogFooter>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setUnregisterTarget(null)}
                className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Annuler
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
