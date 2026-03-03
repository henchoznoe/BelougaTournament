/**
 * File: components/features/admin/player-unban-dialog.tsx
 * Description: Confirmation dialog for unbanning a player.
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
import { unbanPlayer } from '@/lib/actions/players'
import type { PlayerRow } from '@/lib/types/player'

interface PlayerUnbanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: PlayerRow
}

export const PlayerUnbanDialog = ({
  open,
  onOpenChange,
  player,
}: PlayerUnbanDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUnban = () => {
    startTransition(async () => {
      const result = await unbanPlayer({ userId: player.id })

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
            Débannir le joueur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir débannir{' '}
            <span className="font-medium text-zinc-200">{player.name}</span> ?
            Il pourra à nouveau s'inscrire aux tournois.
            {player.banReason && (
              <span className="mt-2 block text-xs text-zinc-500">
                Raison du ban : {player.banReason}
              </span>
            )}
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
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            onClick={handleUnban}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Débannir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
