/**
 * File: components/ui/role-badge.tsx
 * Description: Shared role badge component for displaying user role labels with consistent styling.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Crown, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Role } from '@/prisma/generated/prisma/enums'

type BadgeSize = 'sm' | 'md'

interface RoleBadgeProps {
  role: Role
  size?: BadgeSize
}

const SIZES = {
  sm: { text: 'text-[10px] px-2 py-0.5', icon: 'size-3' },
  md: { text: 'text-xs px-2.5 py-1', icon: 'size-3' },
} as const

export const RoleBadge = ({ role, size = 'sm' }: RoleBadgeProps) => {
  const s = SIZES[size]

  if (role === Role.SUPERADMIN) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-amber-500/10 font-semibold text-amber-400',
          s.text,
        )}
      >
        <Crown className={s.icon} />
        Super Admin
      </span>
    )
  }

  if (role === Role.ADMIN) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-blue-500/10 font-semibold text-blue-400',
          s.text,
        )}
      >
        <ShieldCheck className={s.icon} />
        Admin
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-zinc-500/10 font-semibold text-zinc-400',
        s.text,
      )}
    >
      Joueur
    </span>
  )
}
