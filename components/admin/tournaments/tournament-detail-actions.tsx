/**
 * File: components/admin/tournaments/tournament-detail-actions.tsx
 * Description: Interactive tournament status control with transitions and delete/edit action buttons.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  deleteTournament,
  updateTournamentStatus,
} from '@/lib/actions/tournaments'
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

/** Allowed status transitions for the status badge. */
const STATUS_TRANSITIONS: Record<
  TournamentStatus,
  { label: string; target: TournamentStatus }[]
> = {
  [TournamentStatus.DRAFT]: [
    { label: 'Publier', target: TournamentStatus.PUBLISHED },
  ],
  [TournamentStatus.PUBLISHED]: [
    { label: 'Archiver', target: TournamentStatus.ARCHIVED },
    { label: 'Remettre en brouillon', target: TournamentStatus.DRAFT },
  ],
  [TournamentStatus.ARCHIVED]: [
    { label: 'Remettre en brouillon', target: TournamentStatus.DRAFT },
  ],
} as const

// ─── Status Control (clickable badge with status transitions) ──────────────────────────────

interface TournamentStatusControlProps {
  tournament: TournamentDetail
}

export const TournamentStatusControl = ({
  tournament,
}: TournamentStatusControlProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<{
    label: string
    target: TournamentStatus
  } | null>(null)

  const transitions = STATUS_TRANSITIONS[tournament.status]
  const hasRegistrations = tournament._count.registrations > 0

  const handleStatusChange = () => {
    if (!selectedTransition) return
    startTransition(async () => {
      const result = await updateTournamentStatus({
        id: tournament.id,
        status: selectedTransition.target,
      })
      if (result.success) {
        toast.success(result.message)
        // Navigate to force re-fetch of cached Server Component
        router.push(ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug))
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmOpen(false)
      setSelectedTransition(null)
    })
  }

  const openConfirm = (transition: {
    label: string
    target: TournamentStatus
  }) => {
    setSelectedTransition(transition)
    setConfirmOpen(true)
  }

  // Warning message when changing status with registrations
  const getWarningMessage = () => {
    if (!selectedTransition) return ''
    if (
      selectedTransition.target === TournamentStatus.DRAFT &&
      hasRegistrations
    ) {
      return ' Attention : ce tournoi a des inscrits. Le remettre en brouillon le rendra invisible au public.'
    }
    if (
      selectedTransition.target === TournamentStatus.ARCHIVED &&
      hasRegistrations
    ) {
      return ' Les inscriptions seront fermées.'
    }
    return ''
  }

  if (transitions.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          TOURNAMENT_STATUS_STYLES[tournament.status],
        )}
      >
        {TOURNAMENT_STATUS_LABELS[tournament.status]}
      </span>
    )
  }

  if (transitions.length === 1) {
    return (
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            onClick={() => openConfirm(transitions[0])}
            disabled={isPending}
            aria-label={`Changer le statut du tournoi`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
              'cursor-pointer disabled:cursor-wait disabled:opacity-60',
              TOURNAMENT_STATUS_STYLES[tournament.status],
              'hover:opacity-80',
            )}
          >
            {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            {TOURNAMENT_STATUS_LABELS[tournament.status]}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedTransition?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Passer le tournoi de «{'\u00a0'}
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
              {'\u00a0'}» à «{'\u00a0'}
              {selectedTransition
                ? TOURNAMENT_STATUS_LABELS[selectedTransition.target]
                : ''}
              {'\u00a0'}» ?{getWarningMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Multiple transitions (PUBLISHED has 2 options)
  return (
    <>
      <div className="flex items-center gap-1">
        {transitions.map(transition => (
          <button
            key={transition.target}
            type="button"
            onClick={() => openConfirm(transition)}
            disabled={isPending}
            aria-label={transition.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
              'cursor-pointer disabled:cursor-wait disabled:opacity-60',
              transition === transitions[0]
                ? TOURNAMENT_STATUS_STYLES[tournament.status]
                : 'bg-white/5 text-zinc-400 hover:bg-white/10',
              'hover:opacity-80',
            )}
          >
            {transition === transitions[0] && isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : null}
            {transition === transitions[0]
              ? TOURNAMENT_STATUS_LABELS[tournament.status]
              : transition.label}
          </button>
        ))}
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedTransition?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Passer le tournoi de «{'\u00a0'}
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
              {'\u00a0'}» à «{'\u00a0'}
              {selectedTransition
                ? TOURNAMENT_STATUS_LABELS[selectedTransition.target]
                : ''}
              {'\u00a0'}» ?{getWarningMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Action Buttons (Edit + Delete) ──────────────────────────────────────────

interface TournamentDetailActionsProps {
  tournament: TournamentDetail
}

export const TournamentDetailActions = ({
  tournament,
}: TournamentDetailActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const hasRegistrations = tournament._count.registrations > 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTournament({ id: tournament.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENTS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`${ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug)}/edit`}>
          <Pencil className="size-4" />
          Modifier
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {tournament.title} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le tournoi et toutes ses données
              associées (inscriptions, équipes, paiements) seront définitivement
              supprimés.
              {hasRegistrations && (
                <>
                  {' '}
                  <span className="font-semibold text-amber-400">
                    Attention : ce tournoi a {tournament._count.registrations}{' '}
                    inscription(s).
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
