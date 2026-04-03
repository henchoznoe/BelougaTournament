/**
 * File: components/ui/status-badge.tsx
 * Description: Shared status badge component for displaying user ban/active status with consistent styling.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Ban } from 'lucide-react'
import { isBanned, isPermanentBan } from '@/lib/utils/auth.helpers'
import { cn } from '@/lib/utils/cn'

type BadgeSize = 'sm' | 'md'

interface StatusBadgeProps {
  bannedUntil: Date | string | null
  size?: BadgeSize
}

const SIZES = {
  sm: { text: 'text-[10px] px-2 py-0.5', icon: 'size-3' },
  md: { text: 'text-xs px-2.5 py-1', icon: 'size-3' },
} as const

export const StatusBadge = ({ bannedUntil, size = 'sm' }: StatusBadgeProps) => {
  const s = SIZES[size]
  const banned = isBanned(bannedUntil)
  const permanent = isPermanentBan(bannedUntil)

  if (banned) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-red-500/10 font-semibold text-red-400',
          s.text,
        )}
      >
        <Ban className={s.icon} />
        {permanent ? 'Ban permanent' : 'Banni'}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 font-semibold text-emerald-400',
        s.text,
      )}
    >
      Actif
    </span>
  )
}
