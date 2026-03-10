/**
 * File: components/features/admin/player-ban-dialog.tsx
 * Description: Dialog for banning a player with duration and reason.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { addDays } from 'date-fns'
import { Ban, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { banPlayer } from '@/lib/actions/players'
import {
  BAN_DURATION_OPTIONS,
  PERMANENT_BAN_DATE,
} from '@/lib/config/constants'
import type { BanDurationValue, PlayerRow } from '@/lib/types/player'
import { cn } from '@/lib/utils/cn'

interface PlayerBanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: PlayerRow
}

const DURATION_TO_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export const PlayerBanDialog = ({
  open,
  onOpenChange,
  player,
}: PlayerBanDialogProps) => {
  const [duration, setDuration] = useState<BanDurationValue>('permanent')
  const [customDate, setCustomDate] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const computeBanDate = (): Date | null => {
    if (duration === 'permanent') return PERMANENT_BAN_DATE
    if (duration === 'custom') {
      if (!customDate) return null
      const d = new Date(customDate)
      d.setHours(23, 59, 59, 999)
      return d
    }
    const days = DURATION_TO_DAYS[duration]
    if (days) return addDays(new Date(), days)
    return null
  }

  const handleBan = () => {
    const bannedUntil = computeBanDate()
    if (!bannedUntil) {
      toast.error('Veuillez sélectionner une date valide.')
      return
    }

    startTransition(async () => {
      const result = await banPlayer({
        userId: player.id,
        bannedUntil,
        banReason: reason || undefined,
      })

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        setDuration('permanent')
        setCustomDate('')
        setReason('')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // Minimum date for custom picker: tomorrow
  const minDate = addDays(new Date(), 1).toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Ban className="size-5 text-red-400" />
            Bannir un joueur
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Bannir{' '}
            <span className="font-medium text-zinc-200">{player.name}</span> de
            la plateforme.
          </DialogDescription>
        </DialogHeader>

        {/* Duration selection */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Durée
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BAN_DURATION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-colors',
                  duration === option.value
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-white/5 bg-white/2 text-zinc-400 hover:border-white/10 hover:text-zinc-200',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom date picker */}
          {duration === 'custom' && (
            <Input
              type="date"
              min={minDate}
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="border-white/10 bg-white/5 text-zinc-200"
            />
          )}
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Raison (optionnel)
          </p>
          <Input
            placeholder="Triche, comportement toxique, etc."
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={500}
            className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-zinc-400"
          >
            Annuler
          </Button>
          <Button
            onClick={handleBan}
            disabled={isPending || (duration === 'custom' && !customDate)}
            className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ban className="size-4" />
            )}
            Bannir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
