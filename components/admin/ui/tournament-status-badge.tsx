/**
 * File: components/admin/ui/tournament-status-badge.tsx
 * Description: Reusable status badge for tournament statuses (DRAFT, PUBLISHED, ARCHIVED).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import { cn } from '@/lib/utils/cn'
import type { TournamentStatus } from '@/prisma/generated/prisma/enums'

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
        TOURNAMENT_STATUS_STYLES[status],
        className,
      )}
    >
      {TOURNAMENT_STATUS_LABELS[status]}
    </span>
  )
}
