/**
 * File: components/features/admin/tournament-status-badge.tsx
 * Description: Reusable status badge for tournament statuses (DRAFT, PUBLISHED, ARCHIVED).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { cn } from '@/lib/utils/cn'
import type { TournamentStatus } from '@/prisma/generated/prisma/enums'

const STATUS_STYLES: Record<TournamentStatus, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-400',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-400',
  ARCHIVED: 'bg-zinc-500/10 text-zinc-400',
} as const

const STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
} as const

interface TournamentStatusBadgeProps {
  status: TournamentStatus
  className?: string
}

export const TournamentStatusBadge = ({
  status,
  className,
}: TournamentStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
