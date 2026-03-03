/**
 * File: components/features/admin/tournament-delete-dialog.tsx
 * Description: Confirmation dialog for deleting a tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
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
import { deleteTournament } from '@/lib/actions/tournaments'
import type { TournamentListItem } from '@/lib/types/tournament'

interface TournamentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournament: TournamentListItem
}

export const TournamentDeleteDialog = ({
  open,
  onOpenChange,
  tournament,
}: TournamentDeleteDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTournament({ id: tournament.id })

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-zinc-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Supprimer le tournoi
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir supprimer{' '}
            <span className="font-medium text-zinc-200">
              {tournament.title}
            </span>{' '}
            ? Cette action est irréversible et supprimera toutes les
            inscriptions et équipes associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            variant="destructive"
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
            onClick={handleDelete}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
