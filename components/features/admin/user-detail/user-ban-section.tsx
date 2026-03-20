/**
 * File: components/features/admin/user-detail/user-ban-section.tsx
 * Description: Ban management section with inline ban form, unban action and inline confirmation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { addDays } from 'date-fns'
import { Ban, Loader2, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Input } from '@/components/ui/input'
import { banUser, unbanUser } from '@/lib/actions/users'
import {
  BAN_DURATION_OPTIONS,
  PERMANENT_BAN_DATE,
} from '@/lib/config/constants'
import type { BanDurationValue, UserDetail } from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { cn } from '@/lib/utils/cn'
import { Role } from '@/prisma/generated/prisma/enums'

const DURATION_TO_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

interface UserBanSectionProps {
  user: UserDetail
}

export const UserBanSection = ({ user }: UserBanSectionProps) => {
  const router = useRouter()
  const banned = isBanned(user.bannedUntil)
  const [confirmUnban, setConfirmUnban] = useState(false)
  const [showBanForm, setShowBanForm] = useState(false)
  const [isActionPending, startActionTransition] = useTransition()

  // Ban form state
  const [duration, setDuration] = useState<BanDurationValue>('permanent')
  const [customDate, setCustomDate] = useState('')
  const [banReason, setBanReason] = useState('')

  if (user.role !== Role.USER) return null

  const resetBanForm = () => {
    setDuration('permanent')
    setCustomDate('')
    setBanReason('')
    setShowBanForm(false)
  }

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
      toast.error('Veuillez sélectionner une date valide.')
      return
    }
    startActionTransition(async () => {
      const result = await banUser({
        userId: user.id,
        bannedUntil,
        banReason: banReason || undefined,
      })
      if (result.success) {
        toast.success(result.message)
        resetBanForm()
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleUnban = () => {
    startActionTransition(async () => {
      const result = await unbanUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmUnban(false)
    })
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Ban className="size-4 text-zinc-500" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Gestion du ban
        </h2>
      </div>

      {banned ? (
        confirmUnban ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={isActionPending}
              onClick={handleUnban}
              className="gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            >
              {isActionPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldOff className="size-4" />
              )}
              Confirmer le déban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmUnban(false)}
              disabled={isActionPending}
              className="text-zinc-500"
            >
              Annuler
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setConfirmUnban(true)}
            className="gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          >
            <ShieldOff className="size-4" />
            Débannir
          </Button>
        )
      ) : showBanForm ? (
        <div className="space-y-3">
          <fieldset
            className="grid grid-cols-2 gap-2"
            aria-label="Durée du ban"
          >
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
          </fieldset>

          {duration === 'custom' && (
            <DateTimePicker
              value={customDate}
              onChange={setCustomDate}
              disabled={isActionPending}
              placeholder="Date et heure de fin de ban"
            />
          )}

          <Input
            placeholder="Raison (optionnel)"
            aria-label="Raison du ban"
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            maxLength={500}
            className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              disabled={
                isActionPending || (duration === 'custom' && !customDate)
              }
              onClick={handleBan}
              className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              {isActionPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Bannir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetBanForm}
              disabled={isActionPending}
              className="text-zinc-500"
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setShowBanForm(true)}
          className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          <Ban className="size-4" />
          Bannir
        </Button>
      )}
    </div>
  )
}
