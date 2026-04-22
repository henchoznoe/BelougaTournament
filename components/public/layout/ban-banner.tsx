/**
 * File: components/public/layout/ban-banner.tsx
 * Description: Server component that fetches ban state and renders the client ban banner.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { getSession } from '@/lib/services/auth'
import { getActiveUserBan } from '@/lib/services/users'
import { formatDateTime } from '@/lib/utils/formatting'
import { BanBannerClient } from './ban-banner-client'

export const BanBanner = async () => {
  const session = await getSession()
  if (!session) return null

  const activeBan = await getActiveUserBan(session.user.id)

  if (!activeBan) return null

  return (
    <BanBannerClient
      bannedUntil={activeBan.bannedUntil?.toISOString() ?? null}
      banReason={activeBan.banReason}
      formattedDate={
        activeBan.bannedUntil ? formatDateTime(activeBan.bannedUntil) : null
      }
    />
  )
}
