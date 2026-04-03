/**
 * File: components/features/admin/tournament-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each tournament row in the admin tournaments table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Archive,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TournamentDeleteDialog } from '@/components/features/admin/tournament-delete-dialog'
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
import { updateTournamentStatus } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentListItem } from '@/lib/types/tournament'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

interface TournamentActionsDropdownProps {
  tournament: TournamentListItem
}

export const TournamentActionsDropdown = ({
  tournament,
}: TournamentActionsDropdownProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmStatus, setConfirmStatus] = useState<TournamentStatus | null>(
    null,
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusChange = (newStatus: TournamentStatus) => {
    startTransition(async () => {
      const result = await updateTournamentStatus({
        id: tournament.id,
        status: newStatus,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmStatus(null)
    })
  }

  const getConfirmTitle = (): string => {
    switch (confirmStatus) {
      case TournamentStatus.PUBLISHED:
        return 'Publier le tournoi'
      case TournamentStatus.DRAFT:
        return 'Repasser en brouillon'
      case TournamentStatus.ARCHIVED:
        return 'Archiver le tournoi'
      default:
        return ''
    }
  }

  const getConfirmDescription = (): string => {
    switch (confirmStatus) {
      case TournamentStatus.PUBLISHED:
        return `Le tournoi « ${tournament.title} » sera visible publiquement.`
      case TournamentStatus.DRAFT:
        return `Le tournoi « ${tournament.title} » ne sera plus visible publiquement.`
      case TournamentStatus.ARCHIVED:
        return `Le tournoi « ${tournament.title} » sera archivé et ne sera plus visible sur la page principale.`
      default:
        return ''
    }
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
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-white/10 bg-zinc-950"
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_TOURNAMENT_EDIT(tournament.slug)}>
              <Pencil className="size-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_TOURNAMENT_REGISTRATIONS(tournament.slug)}>
              <Eye className="size-4" />
              Inscriptions
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/5" />

          {tournament.status !== TournamentStatus.PUBLISHED && (
            <DropdownMenuItem
              onClick={() => setConfirmStatus(TournamentStatus.PUBLISHED)}
            >
              <Send className="size-4 text-emerald-400" />
              Publier
            </DropdownMenuItem>
          )}
          {tournament.status !== TournamentStatus.DRAFT && (
            <DropdownMenuItem
              onClick={() => setConfirmStatus(TournamentStatus.DRAFT)}
            >
              <Pencil className="size-4 text-amber-400" />
              Brouillon
            </DropdownMenuItem>
          )}
          {tournament.status !== TournamentStatus.ARCHIVED && (
            <DropdownMenuItem
              onClick={() => setConfirmStatus(TournamentStatus.ARCHIVED)}
            >
              <Archive className="size-4 text-zinc-400" />
              Archiver
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-white/5" />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status confirmation AlertDialog */}
      <AlertDialog
        open={!!confirmStatus}
        onOpenChange={open => !open && setConfirmStatus(null)}
      >
        <AlertDialogContent className="border-white/10 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {getConfirmTitle()}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {getConfirmDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => confirmStatus && handleStatusChange(confirmStatus)}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <TournamentDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        tournament={tournament}
      />
    </>
  )
}
