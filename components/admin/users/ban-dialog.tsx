/**
 * File: components/admin/users/ban-dialog.tsx
 * Description: Shared ban/unban dialog used by both the user detail page and the users table dropdown.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, Loader2, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { banUser, unbanUser } from '@/lib/actions/users'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/formatting'

/** Minimal user shape needed by BanDialog — compatible with UserRow and UserDetail. */
interface BanDialogUser {
  id: string
  name: string
  bannedAt: Date | null
  bannedUntil: Date | null
  banReason: string | null
}

/** Returns true when a user has an active ban (not expired). */
export const isActiveBan = (
  user: Pick<BanDialogUser, 'bannedAt' | 'bannedUntil'>,
): boolean => {
  if (!user.bannedAt) return false
  if (!user.bannedUntil) return true
  return user.bannedUntil > new Date()
}

/** Pad a number to 2 digits. */
const pad = (n: number) => String(n).padStart(2, '0')

/** Builds a "YYYY-MM-DDTHH:mm" string from a Date (local time). */
const toLocalDateTimeString = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const addDays = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toLocalDateTimeString(d)
}

const addMonths = (months: number): string => {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return toLocalDateTimeString(d)
}

/** null = permanent */
const BAN_PRESETS: { label: string; getValue: () => string | null }[] = [
  { label: '7 jours', getValue: () => addDays(7) },
  { label: '14 jours', getValue: () => addDays(14) },
  { label: '1 mois', getValue: () => addMonths(1) },
  { label: 'Permanent', getValue: () => null },
]

interface BanDialogProps {
  user: BanDialogUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const BanDialog = ({ user, open, onOpenChange }: BanDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // undefined = nothing selected yet; null = permanent; string = "YYYY-MM-DDTHH:mm"
  const [bannedUntil, setBannedUntil] = useState<string | null | undefined>(
    undefined,
  )
  const [banReason, setBanReason] = useState('')

  const isBanned = isActiveBan(user)

  const handleBan = () => {
    const resolvedBannedUntil = bannedUntil === undefined ? null : bannedUntil
    startTransition(async () => {
      const result = await banUser({
        userId: user.id,
        bannedUntil: resolvedBannedUntil,
        banReason: banReason.trim() || undefined,
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

  const handleUnban = () => {
    startTransition(async () => {
      const result = await unbanUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const isPresetSelected = (
    label: string,
    getValue: () => string | null,
  ): boolean => {
    if (bannedUntil === undefined) return false
    if (label === 'Permanent') return bannedUntil === null
    if (bannedUntil === null) return false
    // Compare preset value with current value (within 1 min tolerance)
    const presetMs = new Date(getValue() ?? '').getTime()
    const currentMs = new Date(bannedUntil).getTime()
    return Math.abs(currentMs - presetMs) < 60_000
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="size-4 text-red-400" />
            {isBanned
              ? `Gérer le bannissement de ${user.name}`
              : `Bannir ${user.name}`}
          </DialogTitle>
          <DialogDescription>
            {isBanned
              ? 'Ce joueur est actuellement banni. Vous pouvez lever le bannissement ou le modifier.'
              : 'Définissez la durée et la raison du bannissement. Les inscriptions actives aux tournois futurs seront annulées et remboursées si éligibles.'}
          </DialogDescription>
        </DialogHeader>

        {/* Current ban info */}
        {isBanned && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
            <p className="font-medium text-red-400">Banni actuellement</p>
            <p className="mt-1 text-zinc-400">
              {user.bannedUntil
                ? `Jusqu'au ${formatDateTime(user.bannedUntil)}`
                : 'Bannissement permanent'}
            </p>
            {user.banReason && (
              <p className="mt-1 text-zinc-500">Raison : {user.banReason}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Duration presets */}
          <div className="space-y-2">
            <Label>Durée</Label>
            <div className="flex flex-wrap gap-2">
              {BAN_PRESETS.map(preset => {
                const selected = isPresetSelected(preset.label, preset.getValue)
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'text-xs',
                      preset.label === 'Permanent' &&
                        !selected &&
                        'border-red-500/30 text-red-400 hover:bg-red-500/10',
                      preset.label === 'Permanent' &&
                        selected &&
                        'bg-red-600 hover:bg-red-700',
                    )}
                    onClick={() => setBannedUntil(preset.getValue())}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Custom date+time picker — same component as tournaments */}
          <div className="space-y-2">
            <Label>Date et heure personnalisées (optionnel)</Label>
            <DateTimePicker
              value={bannedUntil ?? undefined}
              onChange={val => setBannedUntil(val)}
              placeholder="Choisir une date et heure"
              className="w-full"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="banReason">
              Raison <span className="text-zinc-500">(optionnel)</span>
            </Label>
            <Textarea
              id="banReason"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Ex: Comportement toxique, triche, multi-compte..."
              maxLength={VALIDATION_LIMITS.BAN_REASON_MAX}
              rows={3}
              className="resize-none"
            />
            <p className="text-right text-xs text-zinc-500">
              {banReason.length}/{VALIDATION_LIMITS.BAN_REASON_MAX}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isBanned && (
            <Button
              variant="outline"
              onClick={handleUnban}
              disabled={isPending}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 sm:mr-auto"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlock className="size-4" />
              )}
              Lever le bannissement
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleBan}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ban className="size-4" />
            )}
            {isBanned ? 'Modifier le ban' : 'Bannir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
