/**
 * File: components/public/layout/ban-banner.tsx
 * Description: Server component that fetches ban state and renders the client ban banner.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import prisma from '@/lib/core/prisma'
import { getSession } from '@/lib/services/auth'
import { formatDateTime } from '@/lib/utils/formatting'
import { BanBannerClient } from './ban-banner-client'

/** Returns true when a user has an active ban (not expired). */
const isActiveBan = (
  bannedAt: Date | null,
  bannedUntil: Date | null,
): boolean => {
  if (!bannedAt) return false
  if (!bannedUntil) return true
  return bannedUntil > new Date()
}

export const BanBanner = async () => {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bannedAt: true, bannedUntil: true, banReason: true },
  })

  if (!user || !isActiveBan(user.bannedAt, user.bannedUntil)) return null

  return (
    <BanBannerClient
      bannedUntil={user.bannedUntil?.toISOString() ?? null}
      banReason={user.banReason ?? null}
      formattedDate={user.bannedUntil ? formatDateTime(user.bannedUntil) : null}
    />
  )
}
