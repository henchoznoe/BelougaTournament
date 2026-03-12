/**
 * File: components/features/admin/ban-user-dialog.tsx
 * Description: Reusable dialog for banning a user with duration and reason selection.
 * Author: Noe Henchoz
 * License: MIT
 * Copyright (c) 2026 Noe Henchoz
 */

'use client'

import { addDays } from 'date-fns'
import { Ban, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { banUser } from '@/lib/actions/users'
import {
  BAN_DURATION_OPTIONS,
  PERMANENT_BAN_DATE,
} from '@/lib/config/constants'
import type { BanDurationValue } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'

const DURATION_TO_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

interface BanUserDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const BanUserDialog = ({
  userId,
  userName,
  open,
  onOpenChange,
}: BanUserDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [duration, setDuration] = useState<BanDurationValue>('permanent')
  const [customDate, setCustomDate] = useState('')
  const [banReason, setBanReason] = useState('')

  const computeBanDate = (): Date | null => {
    if (duration === 'permanent') return PERMANENT_BAN_DATE
    if (duration === 'custom') {
      if (!customDate) return null
      const d = new Date(customDate)
      if (Number.isNaN(d.getTime())) return null
      return d
    }
    const days = DURATION_TO_DAYS[duration]
    if (days) return addDays(new Date(), days)
    return null
  }

  const handleBan = () => {
    const bannedUntil = computeBanDate()
    if (!bannedUntil) {
      toast.error('Veuillez selectionner une date valide.')
      return
    }
    startTransition(async () => {
      const result = await banUser({
        userId,
        bannedUntil,
        banReason: banReason || undefined,
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setDuration('permanent')
      setCustomDate('')
      setBanReason('')
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Bannir {userName}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Choisissez la duree et la raison du ban.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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

          {duration === 'custom' && (
            <DateTimePicker
              value={customDate}
              onChange={setCustomDate}
              disabled={isPending}
              placeholder="Date et heure de fin de ban"
            />
          )}

          <Input
            placeholder="Raison (optionnel)"
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            maxLength={500}
            className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              disabled={isPending || (duration === 'custom' && !customDate)}
              onClick={handleBan}
              className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Bannir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="text-zinc-500"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
