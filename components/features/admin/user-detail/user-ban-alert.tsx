/**
 * File: components/features/admin/user-detail/user-ban-alert.tsx
 * Description: Alert banner displayed when a user is currently banned, showing ban duration and reason.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import type { UserDetail } from '@/lib/types/user'
import { isBanned, isPermanentBan } from '@/lib/utils/auth.helpers'
import { formatDate } from '@/lib/utils/formatting'

interface UserBanAlertProps {
  user: UserDetail
}

export const UserBanAlert = ({ user }: UserBanAlertProps) => {
  const banned = isBanned(user.bannedUntil)
  const permanent = isPermanentBan(user.bannedUntil)

  if (!banned) return null

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
      {permanent ? (
        <p className="font-medium">Ban permanent</p>
      ) : (
        user.bannedUntil && (
          <p className="font-medium">
            Banni jusqu&apos;au {formatDate(user.bannedUntil)}
          </p>
        )
      )}
      {user.banReason ? (
        <p className="mt-1 text-red-400">Raison : {user.banReason}</p>
      ) : (
        <p className="mt-1 text-red-400/60">Aucune raison spécifiée.</p>
      )}
    </div>
  )
}
