/**
 * File: components/admin/tournaments/tournament-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each tournament row in the admin tournaments table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Archive,
  Eye,
  Globe,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deleteTournament,
  updateTournamentStatus,
} from '@/lib/actions/tournaments'
import { TOURNAMENT_STATUS_LABELS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentListItem } from '@/lib/types/tournament'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

// ─── Status Transitions ──────────────────────────────────────────────────────

interface StatusTransition {
  label: string
  target: TournamentStatus
  icon: typeof Globe
  className: string
}

const STATUS_TRANSITIONS: Record<TournamentStatus, StatusTransition[]> = {
  [TournamentStatus.DRAFT]: [
    {
      label: 'Publier',
      target: TournamentStatus.PUBLISHED,
      icon: Globe,
      className: 'text-emerald-400',
    },
  ],
  [TournamentStatus.PUBLISHED]: [
    {
      label: 'Archiver',
      target: TournamentStatus.ARCHIVED,
      icon: Archive,
      className: 'text-zinc-400',
    },
    {
      label: 'Remettre en brouillon',
      target: TournamentStatus.DRAFT,
      icon: RotateCcw,
      className: 'text-amber-400',
    },
  ],
  [TournamentStatus.ARCHIVED]: [
    {
      label: 'Remettre en brouillon',
      target: TournamentStatus.DRAFT,
      icon: RotateCcw,
      className: 'text-amber-400',
    },
  ],
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a contextual warning for status transitions when registrations exist. */
const getTransitionWarning = (
  target: TournamentStatus,
  registrationCount: number,
): string => {
  if (registrationCount === 0) return ''
  if (target === TournamentStatus.DRAFT) {
    return ` Attention : ce tournoi a ${registrationCount} inscription(s). Le remettre en brouillon le rendra invisible au public.`
  }
  if (target === TournamentStatus.ARCHIVED) {
    return ' Les inscriptions seront fermées.'
  }
  return ''
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TournamentActionsDropdownProps {
  tournament: TournamentListItem
}

export const TournamentActionsDropdown = ({
  tournament,
}: TournamentActionsDropdownProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] =
    useState<StatusTransition | null>(null)

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
        router.push(ROUTES.ADMIN_TOURNAMENTS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setStatusDialogOpen(false)
      setSelectedTransition(null)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTournament({ id: tournament.id })
      if (result.success) {
        toast.success(result.message)
        // Navigate to force re-fetch of cached Server Component
        router.push(ROUTES.ADMIN_TOURNAMENTS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setDeleteDialogOpen(false)
    })
  }

  const openStatusConfirm = (transition: StatusTransition) => {
    setSelectedTransition(transition)
    setStatusDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions pour ${tournament.title}`}
            className="text-zinc-400 hover:text-zinc-200"
            onClick={e => e.stopPropagation()}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-white/10 bg-zinc-950"
          onClick={e => e.stopPropagation()}
        >
          {/* Navigation */}
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug)}>
              <Eye className="size-4" />
              Voir le tournoi
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_TOURNAMENT_EDIT(tournament.slug)}>
              <Pencil className="size-4" />
              Modifier
            </Link>
          </DropdownMenuItem>

          {/* Status transitions */}
          {transitions.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-white/5" />
              {transitions.map(transition => {
                const Icon = transition.icon
                return (
                  <DropdownMenuItem
                    key={transition.target}
                    onClick={() => openStatusConfirm(transition)}
                    disabled={isPending}
                  >
                    <Icon className={`size-4 ${transition.className}`} />
                    {transition.label}
                  </DropdownMenuItem>
                )
              })}
            </>
          )}

          {/* Delete */}
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
            className="text-red-400 focus:text-red-400"
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status change confirmation dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedTransition?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Passer le tournoi de «{'\u00a0'}
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
              {'\u00a0'}» à «{'\u00a0'}
              {selectedTransition
                ? TOURNAMENT_STATUS_LABELS[selectedTransition.target]
                : ''}
              {'\u00a0'}» ?
              {selectedTransition
                ? getTransitionWarning(
                    selectedTransition.target,
                    tournament._count.registrations,
                  )
                : ''}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
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
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
